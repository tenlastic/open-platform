import * as k8s from '@kubernetes/client-node';

import { NamespaceDocument, NamespaceWorkflowLimitsSchema } from '../../models/namespace';
import {
  WorkflowDocument,
  WorkflowEvent,
  WorkflowSpecTemplate,
  WorkflowSpecTemplateResourcesSchema,
  WorkflowSpecTemplateSchema,
} from '../../models/workflow';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

WorkflowEvent.sync(async payload => {
  const workflow = payload.fullDocument;

  if (!workflow.populated('namespaceDocument')) {
    await workflow.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesWorkflow.delete(workflow.namespaceDocument, workflow);
  } else if (payload.operationType === 'insert') {
    await KubernetesWorkflow.create(workflow.namespaceDocument, workflow);
  }
});

export const KubernetesWorkflow = {
  create: async (namespace: NamespaceDocument, workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);

    /**
     * ======================
     * NETWORK POLICY
     * ======================
     */
    await networkingV1.createNamespacedNetworkPolicy(namespace.kubernetesNamespace, {
      metadata: { name },
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
            app: name,
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
    await rbacAuthorizationV1.createNamespacedRole(namespace.kubernetesNamespace, {
      metadata: { name },
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
    await coreV1.createNamespacedServiceAccount(namespace.kubernetesNamespace, {
      metadata: { name },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(namespace.kubernetesNamespace, {
      metadata: { name },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name,
          namespace: namespace.kubernetesNamespace,
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

    const response: any = await customObjects.createNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      namespace.kubernetesNamespace,
      'workflows',
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: { name },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          automountServiceAccountToken: false,
          dnsPolicy: 'Default',
          entrypoint: workflow.spec.entrypoint,
          executor: { serviceAccountName: name },
          parallelism:
            workflow.spec.parallelism ||
            workflow.namespaceDocument.limits.workflows.parallelism ||
            Infinity,
          podGC: {
            strategy: 'OnPodCompletion',
          },
          serviceAccountName: name,
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

    /**
     * ======================
     * OWNER REFERENCES
     * ======================
     */
    const ownerReferences = [
      {
        apiVersion: 'argoproj.io/v1alpha1',
        controller: true,
        kind: 'Workflow',
        name,
        uid: response.body.metadata.uid,
      },
    ];
    await networkingV1.patchNamespacedNetworkPolicy(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await rbacAuthorizationV1.patchNamespacedRole(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await coreV1.patchNamespacedServiceAccount(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await rbacAuthorizationV1.patchNamespacedRoleBinding(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
  },
  delete: async (namespace: NamespaceDocument, workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await customObjects.deleteNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      namespace.kubernetesNamespace,
      'workflows',
      name,
    );
  },
  getName(workflow: WorkflowDocument) {
    return `workflow-${workflow._id}`;
  },
};

/**
 * Gets the manifest for resources.
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
      app: KubernetesWorkflow.getName(workflow),
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
