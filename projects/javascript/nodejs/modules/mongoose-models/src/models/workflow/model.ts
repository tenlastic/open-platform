import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
} from '@hasezoey/typegoose';
import * as k8s from '@kubernetes/client-node';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as path from 'path';

import {
  Namespace,
  NamespaceDocument,
  NamespaceEvent,
  NamespaceLimitError,
  NamespaceWorkflowLimitsSchema,
} from '../namespace';
import {
  WorkflowSpecSchema,
  WorkflowSpecTemplate,
  WorkflowSpecTemplateResourcesSchema,
  WorkflowSpecTemplateSchema,
} from './spec';
import { WorkflowStatusSchema } from './status';

export const WorkflowEvent = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

// Publish changes to Kafka.
WorkflowEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Workflows if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Workflow.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

@index({ namespaceId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'workflows',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WorkflowEvent })
@pre('remove', async function(this: WorkflowDocument) {
  await this.deleteKubernetesResources();
})
@post('save', async function(this: WorkflowDocument) {
  if (this.wasNew) {
    await this.createKubernetesResources();
  } else if (this.status && this.status.finishedAt) {
    await this.deleteKubernetesResources();
  }
})
export class WorkflowSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ immutable: true })
  public isPreemptible: boolean;

  @prop({ immutable: true, required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ immutable: true, required: true })
  public spec: WorkflowSpecSchema;

  @prop()
  public status: WorkflowStatusSchema;

  @prop()
  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  private get kubernetesNamespace() {
    return `namespace-${this.namespaceId}`;
  }

  private get kubernetesResourceName() {
    return `workflow-${this._id}`;
  }

  public static async checkNamespaceLimits(
    count: number,
    isPreemptible: boolean,
    namespaceId: string | mongoose.Types.ObjectId,
    parallelism: number,
    templates: WorkflowSpecTemplateSchema[],
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.workflows;

    const cpuSums = templates.map(t => {
      let sum = 0;

      if (t.script && t.script.resources && t.script.resources.cpu) {
        sum += t.script.resources.cpu;
      }
      if (t.sidecars) {
        t.sidecars.forEach(s => (sum += s.resources && s.resources.cpu ? s.resources.cpu : 0));
      }

      return sum;
    });
    if (limits.cpu > 0 && Math.max(...cpuSums) > limits.cpu) {
      throw new NamespaceLimitError('workflows.cpu', limits.cpu);
    }

    const memorySums = templates.map(t => {
      let sum = 0;

      if (t.script && t.script.resources && t.script.resources.memory) {
        sum += t.script.resources.memory;
      }
      if (t.sidecars) {
        t.sidecars.forEach(
          s => (sum += s.resources && s.resources.memory ? s.resources.memory : 0),
        );
      }

      return sum;
    });
    if (limits.memory > 0 && Math.max(...memorySums) > limits.memory) {
      throw new NamespaceLimitError('workflows.memory', limits.memory);
    }

    if (limits.parallelism && parallelism > limits.parallelism) {
      throw new NamespaceLimitError('workflows.parallelism', limits.parallelism);
    }

    if (limits.preemptible && isPreemptible === false) {
      throw new NamespaceLimitError('workflows.preemptible', limits.preemptible);
    }

    if (limits.count > 0) {
      const results = await Workflow.countDocuments({
        namespaceId: namespace._id,
        'status.finishedAt': { $exists: false },
      });

      if (results + count > limits.count) {
        throw new NamespaceLimitError('workflows.count', limits.count);
      }
    }
  }

  /**
   * Creates an Argo Workflow within Kubernetes if it does not exist.
   */
  private async createKubernetesResources(this: WorkflowDocument) {
    /**
     * ======================
     * NETWORK POLICY
     * ======================
     */
    await networkingV1.createNamespacedNetworkPolicy(this.kubernetesNamespace, {
      metadata: {
        name: this.kubernetesResourceName,
      },
      spec: {
        egress: [
          {
            to: [
              {
                ipBlock: {
                  cidr: '0.0.0.0/0',
                  except: ['10.0.0.0/8', '172.0.0.0/8', '192.0.0.0/8'],
                },
              },
            ],
          },
        ],
        podSelector: {
          matchLabels: {
            app: this.kubernetesResourceName,
            role: 'application',
          },
        },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await this.createWorkflow();

    /**
     * ======================
     * WORKFLOW SIDECARS
     * ======================
     */
    await this.createSidecars();
  }

  /**
   * Creates the sidecars and associated resources from Kubernetes.
   */
  private async createSidecars(this: WorkflowDocument) {
    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(this.kubernetesNamespace, {
      metadata: {
        name: `${this.kubernetesResourceName}-sidecar`,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: ['argoproj.io'],
          resources: ['workflows'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(this.kubernetesNamespace, {
      metadata: {
        name: `${this.kubernetesResourceName}-sidecar`,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(this.kubernetesNamespace, {
      metadata: {
        name: `${this.kubernetesResourceName}-sidecar`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: `${this.kubernetesResourceName}-sidecar`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${this.kubernetesResourceName}-sidecar`,
          namespace: this.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const administrator = { roles: ['workflows'] };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: 'cloud.google.com/gke-preemptible',
                  operator: this.isPreemptible ? 'Exists' : 'DoesNotExist',
                },
              ],
            },
          ],
        },
      },
    };
    const env = [
      { name: 'ACCESS_TOKEN', value: accessToken },
      { name: 'WORKFLOW_ID', value: this._id.toHexString() },
      { name: 'WORKFLOW_NAME', value: this.kubernetesResourceName },
      { name: 'WORKFLOW_NAMESPACE', value: this.kubernetesNamespace },
    ];

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let sidecarPodManifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      sidecarPodManifest = {
        metadata: {
          labels: {
            app: this.kubernetesResourceName,
            role: 'sidecar',
          },
          name: `${this.kubernetesResourceName}-sidecar`,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '64M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/workflow-sidecar/',
            },
          ],
          restartPolicy: 'Always',
          serviceAccountName: `${this.kubernetesResourceName}-sidecar`,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      sidecarPodManifest = {
        metadata: {
          labels: {
            app: this.kubernetesResourceName,
            role: 'sidecar',
          },
          name: `${this.kubernetesResourceName}-sidecar`,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/workflow-sidecar:${version}`,
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '64M' } },
            },
          ],
          restartPolicy: 'Always',
          serviceAccountName: `${this.kubernetesResourceName}-sidecar`,
        },
      };
    }

    await appsV1.createNamespacedDeployment(this.kubernetesNamespace, {
      metadata: {
        labels: {
          app: this.kubernetesResourceName,
          role: 'sidecar',
        },
        name: `${this.kubernetesResourceName}-sidecar`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: this.kubernetesResourceName,
            role: 'sidecar',
          },
        },
        template: sidecarPodManifest,
      },
    });
  }

  /**
   * Creates the workflow and associated resources from Kubernetes.
   */
  private async createWorkflow(this: WorkflowDocument) {
    if (!this.populated('namespaceDocument')) {
      await this.populate('namespaceDocument').execPopulate();
    }

    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(this.kubernetesNamespace, {
      metadata: {
        name: `${this.kubernetesResourceName}-application`,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods'],
          verbs: ['get', 'patch', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['pods/log'],
          verbs: ['get', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(this.kubernetesNamespace, {
      metadata: {
        name: `${this.kubernetesResourceName}-application`,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(this.kubernetesNamespace, {
      metadata: {
        name: `${this.kubernetesResourceName}-application`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: `${this.kubernetesResourceName}-application`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${this.kubernetesResourceName}-application`,
          namespace: this.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: 'cloud.google.com/gke-preemptible',
                  operator: this.isPreemptible ? 'Exists' : 'DoesNotExist',
                },
              ],
            },
          ],
        },
      },
    };

    const templates = this.spec.templates.map(t =>
      this.getTemplateManifest(this.namespaceDocument.limits.workflows, t),
    );

    await customObjects.createNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      this.kubernetesNamespace,
      'workflows',
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: { name: this.kubernetesResourceName },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          automountServiceAccountToken: false,
          dnsPolicy: 'Default',
          entrypoint: this.spec.entrypoint,
          executor: { serviceAccountName: `${this.kubernetesResourceName}-application` },
          parallelism:
            this.spec.parallelism ||
            this.namespaceDocument.limits.workflows.parallelism ||
            Infinity,
          serviceAccountName: `${this.kubernetesResourceName}-application`,
          templates,
          volumeClaimTemplates: [
            {
              metadata: { name: 'workspace' },
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: {
                  requests: {
                    storage: '10Gi',
                  },
                },
              },
            },
          ],
        },
      },
    );
  }

  /**
   * Deletes an Argo Workflow within Kubernetes.
   */
  private async deleteKubernetesResources(this: WorkflowDocument) {
    /**
     * ======================
     * NETWORK POLICY
     * ======================
     */
    try {
      await networkingV1.deleteNamespacedNetworkPolicy(
        this.kubernetesResourceName,
        this.kubernetesNamespace,
      );
    } catch {}

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    try {
      await this.deleteWorkflow();
    } catch {}

    /**
     * ======================
     * WORKFLOW SIDECARS
     * ======================
     */
    try {
      await this.deleteSidecars();
    } catch {}
  }

  /**
   * Deletes the sidecars and associated resources from Kubernetes.
   */
  private async deleteSidecars(this: WorkflowDocument) {
    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.deleteNamespacedRole(
      `${this.kubernetesResourceName}-sidecar`,
      this.kubernetesNamespace,
    );
    await coreV1.deleteNamespacedServiceAccount(
      `${this.kubernetesResourceName}-sidecar`,
      this.kubernetesNamespace,
    );
    await rbacAuthorizationV1.deleteNamespacedRoleBinding(
      `${this.kubernetesResourceName}-sidecar`,
      this.kubernetesNamespace,
    );

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await appsV1.deleteNamespacedDeployment(
      `${this.kubernetesResourceName}-sidecar`,
      this.kubernetesNamespace,
    );
  }

  /**
   * Deletes the workflow and associated resources from Kubernetes.
   */
  private async deleteWorkflow(this: WorkflowDocument) {
    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.deleteNamespacedRole(
      `${this.kubernetesResourceName}-application`,
      this.kubernetesNamespace,
    );
    await coreV1.deleteNamespacedServiceAccount(
      `${this.kubernetesResourceName}-application`,
      this.kubernetesNamespace,
    );
    await rbacAuthorizationV1.deleteNamespacedRoleBinding(
      `${this.kubernetesResourceName}-application`,
      this.kubernetesNamespace,
    );

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await customObjects.deleteNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      this.kubernetesNamespace,
      'workflows',
      this.kubernetesResourceName,
    );
  }

  /**
   * Gets the manigest for resources.
   */
  private getResourcesManifest(
    this: WorkflowDocument,
    resources: WorkflowSpecTemplateResourcesSchema,
  ) {
    const r: any = {};

    if (resources.cpu) {
      r.cpu = resources.cpu.toString();
    }
    if (resources.memory) {
      r.memory = resources.memory.toString();
    }

    return r;
  }

  /**
   * Gets the manifest for a template.
   */
  private getTemplateManifest(
    this: WorkflowDocument,
    limits: NamespaceWorkflowLimitsSchema,
    template: WorkflowSpecTemplateSchema,
  ) {
    const t = new WorkflowSpecTemplate(template).toObject();
    if (!t.script) {
      return t;
    }

    t.artifactLocation = { archiveLogs: false };
    t.metadata = {
      labels: {
        app: this.kubernetesResourceName,
        role: 'application',
      },
    };

    const sidecars = t.sidecars ? t.sidecars.length : 0;
    const resources: any = {
      cpu: limits.cpu ? limits.cpu / (sidecars + 1) : undefined,
      memory: limits.memory ? limits.memory / (sidecars + 1) : undefined,
    };

    if (t.script.resources) {
      t.script.resources = {
        limits: this.getResourcesManifest(t.script.resources),
        requests: this.getResourcesManifest(t.script.resources),
      };
    } else if (limits.cpu || limits.memory) {
      t.script.resources = {
        limits: this.getResourcesManifest(resources),
        requests: this.getResourcesManifest(resources),
      };
    }

    if (t.script.workspace) {
      t.script.volumeMounts = [{ mountPath: '/ws/', name: 'workspace' }];
    }

    if (t.sidecars) {
      t.sidecars = t.sidecars.map(s => {
        if (s.resources) {
          s.resources = {
            limits: this.getResourcesManifest(s.resources),
            requests: this.getResourcesManifest(s.resources),
          };
        } else if (limits.cpu || limits.memory) {
          s.resources = {
            limits: this.getResourcesManifest(resources),
            requests: this.getResourcesManifest(resources),
          };
        }

        return s;
      });
    }

    return t;
  }
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export type WorkflowModel = ReturnModelType<typeof WorkflowSchema>;
export const Workflow = getModelForClass(WorkflowSchema);
