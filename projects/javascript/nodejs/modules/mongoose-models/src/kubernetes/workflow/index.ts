import * as k8s from '@kubernetes/client-node';

import { NamespaceDocument, NamespaceWorkflowLimitsSchema, WorkflowDocument } from '../../models';
import {
  WorkflowSpecTemplate,
  WorkflowSpecTemplateResourcesSchema,
  WorkflowSpecTemplateSchema,
} from '../../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

export const Workflow = {
  create: async (namespace: NamespaceDocument, workflow: WorkflowDocument) => {
    /**
     * ======================
     * NETWORK POLICY
     * ======================
     */
    await networkingV1.createNamespacedNetworkPolicy(workflow.kubernetesNamespace, {
      metadata: {
        name: workflow.kubernetesName,
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
            app: workflow.kubernetesName,
            role: 'application',
          },
        },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(workflow.kubernetesNamespace, {
      metadata: {
        name: `${workflow.kubernetesName}-application`,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods'],
          verbs: ['get', 'patch', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['pods/exec'],
          verbs: ['create'],
        },
        {
          apiGroups: [''],
          resources: ['pods/log'],
          verbs: ['get', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(workflow.kubernetesNamespace, {
      metadata: {
        name: `${workflow.kubernetesName}-application`,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(workflow.kubernetesNamespace, {
      metadata: {
        name: `${workflow.kubernetesName}-application`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: `${workflow.kubernetesName}-application`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${workflow.kubernetesName}-application`,
          namespace: workflow.kubernetesNamespace,
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
                  key: workflow.isPreemptible
                    ? 'tenlastic.com/low-priority'
                    : 'tenlastic.com/high-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
    };

    const templates = workflow.spec.templates.map(t =>
      getTemplateManifest(namespace.limits.workflows, t, workflow),
    );

    await customObjects.createNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      workflow.kubernetesNamespace,
      'workflows',
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: { name: workflow.kubernetesName },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          automountServiceAccountToken: false,
          dnsPolicy: 'Default',
          entrypoint: workflow.spec.entrypoint,
          executor: { serviceAccountName: `${workflow.kubernetesName}-application` },
          parallelism:
            workflow.spec.parallelism ||
            workflow.namespaceDocument.limits.workflows.parallelism ||
            Infinity,
          podGC: {
            strategy: 'OnPodCompletion',
          },
          serviceAccountName: `${workflow.kubernetesName}-application`,
          templates,
          ttlStrategy: {
            secondsAfterCompletion: 30,
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
  },
  delete: async (workflow: WorkflowDocument) => {
    /**
     * ======================
     * NETWORK POLICY
     * ======================
     */
    try {
      await networkingV1.deleteNamespacedNetworkPolicy(
        workflow.kubernetesName,
        workflow.kubernetesNamespace,
      );
    } catch {}

    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.deleteNamespacedRole(
      `${workflow.kubernetesName}-application`,
      workflow.kubernetesNamespace,
    );
    await coreV1.deleteNamespacedServiceAccount(
      `${workflow.kubernetesName}-application`,
      workflow.kubernetesNamespace,
    );
    await rbacAuthorizationV1.deleteNamespacedRoleBinding(
      `${workflow.kubernetesName}-application`,
      workflow.kubernetesNamespace,
    );

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await customObjects.deleteNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      workflow.kubernetesNamespace,
      'workflows',
      workflow.kubernetesName,
    );
  },
};

/**
 * Gets the manigest for resources.
 */
function getResourcesManifest(resources: WorkflowSpecTemplateResourcesSchema) {
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
function getTemplateManifest(
  limits: NamespaceWorkflowLimitsSchema,
  template: WorkflowSpecTemplateSchema,
  workflow: WorkflowDocument,
) {
  const t = new WorkflowSpecTemplate(template).toObject();
  if (!t.script) {
    return t;
  }

  t.artifactLocation = { archiveLogs: false };
  t.metadata = {
    annotations: {
      'tenlastic.com/nodeId': `{{ tasks.${template.name}.id }}`,
      'tenlastic.com/workflowId': workflow._id.toString(),
    },
    labels: {
      app: workflow.kubernetesName,
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
      limits: getResourcesManifest(t.script.resources),
      requests: getResourcesManifest(t.script.resources),
    };
  } else if (limits.cpu || limits.memory) {
    t.script.resources = {
      limits: getResourcesManifest(resources),
      requests: getResourcesManifest(resources),
    };
  }

  if (t.script.workspace) {
    t.script.volumeMounts = [{ mountPath: '/ws/', name: 'workspace' }];
  }

  if (t.sidecars) {
    t.sidecars = t.sidecars.map(s => {
      if (s.resources) {
        s.resources = {
          limits: getResourcesManifest(s.resources),
          requests: getResourcesManifest(s.resources),
        };
      } else if (limits.cpu || limits.memory) {
        s.resources = {
          limits: getResourcesManifest(resources),
          requests: getResourcesManifest(resources),
        };
      }

      return s;
    });
  }

  return t;
}
