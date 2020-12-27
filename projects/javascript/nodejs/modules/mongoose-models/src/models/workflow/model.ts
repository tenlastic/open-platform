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
import * as mongoose from 'mongoose';

import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { WorkflowSpecDocument, WorkflowSpecTemplate } from './spec';

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
  if (!this.wasNew) {
    return;
  }

  await this.createKubernetesResources();
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
  public spec: WorkflowSpecDocument;

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

  /**
   * Deletes an Argo Workflow within Kubernetes.
   */
  private async deleteKubernetesResources() {
    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    try {
      await networkingV1.deleteNamespacedNetworkPolicy(
        this.kubernetesResourceName,
        this.kubernetesNamespace,
      );
    } catch {}

    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    try {
      await rbacAuthorizationV1.deleteNamespacedRole(
        this.kubernetesResourceName,
        this.kubernetesNamespace,
      );
      await coreV1.deleteNamespacedServiceAccount(
        this.kubernetesResourceName,
        this.kubernetesNamespace,
      );
      await rbacAuthorizationV1.deleteNamespacedRoleBinding(
        this.kubernetesResourceName,
        this.kubernetesNamespace,
      );
    } catch {}

    /**
     * =======================
     * WORKFLOW
     * =======================
     */
    try {
      await customObjects.deleteNamespacedCustomObject(
        'argoproj.io',
        'v1alpha1',
        this.kubernetesNamespace,
        'workflows',
        this.kubernetesResourceName,
      );
    } catch {}
  }

  /**
   * Creates an Argo Workflow within Kubernetes if it does not exist.
   */
  private async createKubernetesResources() {
    /**
     * =======================
     * NETWORK POLICY
     * =======================
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
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(this.kubernetesNamespace, {
      metadata: {
        name: this.kubernetesResourceName,
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
        name: this.kubernetesResourceName,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(this.kubernetesNamespace, {
      metadata: {
        name: this.kubernetesResourceName,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: this.kubernetesResourceName,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: this.kubernetesResourceName,
          namespace: this.kubernetesNamespace,
        },
      ],
    });

    /**
     * =======================
     * WORKFLOW
     * =======================
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

    const templates = this.spec.templates.map(t => {
      const template = new WorkflowSpecTemplate(t).toObject();

      if (!template.script) {
        return template;
      }

      template.artifactLocation = { archiveLogs: false };
      template.metadata = {
        labels: {
          app: this.kubernetesResourceName,
          role: 'application',
        },
      };

      if (template.script.workspace) {
        template.script.volumeMounts = [{ mountPath: '/ws/', name: 'workspace' }];
      }

      return template;
    });

    await customObjects.createNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      this.kubernetesNamespace,
      'workflows',
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: {
          name: this.kubernetesResourceName,
        },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          automountServiceAccountToken: false,
          dnsPolicy: 'Default',
          entrypoint: this.spec.entrypoint,
          executor: { serviceAccountName: this.kubernetesResourceName },
          podGC: { strategy: 'OnPodCompletion' },
          serviceAccountName: this.kubernetesResourceName,
          templates,
          ttlStrategy: {
            secondsAfterSuccess: 60 * 60,
          },
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
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export type WorkflowModel = ReturnModelType<typeof WorkflowSchema>;
export const Workflow = getModelForClass(WorkflowSchema);
