import * as k8s from '@kubernetes/client-node';
import {
  NamespaceDocument,
  WorkflowDocument,
  WorkflowEvent,
  WorkflowSpecTemplate,
  WorkflowSpecTemplateSchema,
} from '@tenlastic/mongoose-models';

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
            'tenlastic.com/app': name,
            'tenlastic.com/role': 'application',
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

    const templates = workflow.spec.templates.map(t => getTemplateManifest(t, workflow));

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
          parallelism: workflow.spec.parallelism,
          serviceAccountName: name,
          templates,
          ttlStrategy: {
            secondsAfterCompletion: 300,
          },
          volumeClaimTemplates: [
            {
              metadata: { name: 'workspace' },
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: {
                  requests: {
                    storage: `${workflow.storage}`,
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
    const headers = { 'Content-Type': 'application/strategic-merge-patch+json' };
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
      { headers },
    );
    await rbacAuthorizationV1.patchNamespacedRole(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers },
    );
    await coreV1.patchNamespacedServiceAccount(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers },
    );
    await rbacAuthorizationV1.patchNamespacedRoleBinding(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers },
    );
  },
  delete: async (namespace: NamespaceDocument, workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    try {
      await customObjects.deleteNamespacedCustomObject(
        'argoproj.io',
        'v1alpha1',
        namespace.kubernetesNamespace,
        'workflows',
        name,
      );
    } catch {}
  },
  getName(workflow: WorkflowDocument) {
    return `workflow-${workflow._id}`;
  },
};

/**
 * Gets the manifest for a template.
 */
function getTemplateManifest(template: WorkflowSpecTemplateSchema, workflow: WorkflowDocument) {
  const t = new WorkflowSpecTemplate(template).toObject();
  if (!t.script) {
    return t;
  }

  t.artifactLocation = { archiveLogs: false };
  t.metadata = {
    annotations: {
      'tenlastic.com/nodeId': `{{pod.name}}`,
      'tenlastic.com/workflowId': workflow._id.toString(),
    },
    labels: {
      'tenlastic.com/app': KubernetesWorkflow.getName(workflow),
      'tenlastic.com/role': 'application',
    },
  };

  const sidecars = t.sidecars ? t.sidecars.length : 0;
  const cpu = workflow.cpu / (1 + sidecars);
  const memory = workflow.memory / (1 + sidecars);
  const resources = { cpu: `${cpu}`, memory: `${memory}` };

  t.script.resources = { limits: resources, requests: resources };

  if (t.script.workspace) {
    t.script.volumeMounts = [{ mountPath: '/workspace/', name: 'workspace' }];
  }

  if (t.sidecars) {
    t.sidecars = t.sidecars.map(s => {
      s.resources = { limits: resources, requests: resources };
      return s;
    });
  }

  return t;
}
