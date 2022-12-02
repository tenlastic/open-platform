import { networkPolicyApiV1, workflowApiV1 } from '@tenlastic/kubernetes';
import {
  DatabaseOperationType,
  WorkflowDocument,
  WorkflowSpecTemplateModel,
  WorkflowSpecTemplateSchema,
} from '@tenlastic/mongoose';

import { KubernetesNamespace } from './namespace';

export const KubernetesWorkflow = {
  delete: async (workflow: WorkflowDocument, operationType?: DatabaseOperationType) => {
    const name = KubernetesWorkflow.getName(workflow);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    if (operationType === 'delete') {
      await workflowApiV1.delete(name, 'dynamic');
    }
  },
  getLabels: (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${workflow.namespaceId}`,
      'tenlastic.com/workflowId': `${workflow._id}`,
    };
  },
  getName: (workflow: WorkflowDocument) => {
    return `workflow-${workflow._id}`;
  },
  upsert: async (workflow: WorkflowDocument) => {
    const labels = KubernetesWorkflow.getLabels(workflow);
    const name = KubernetesWorkflow.getName(workflow);
    const namespaceName = KubernetesNamespace.getName(workflow.namespaceId);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
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
                  key: workflow.preemptible
                    ? 'tenlastic.com/low-priority'
                    : 'tenlastic.com/high-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
      podAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'workflows.argoproj.io/workflow',
                    operator: 'In',
                    values: ['{{workflow.name}}'],
                  },
                ],
              },
              topologyKey: 'kubernetes.io/hostname',
            },
            weight: 1,
          },
        ],
      },
    };
    const templates = workflow.spec.templates.map((t) => getTemplateManifest(t, workflow));
    await workflowApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'Application' },
        name,
      },
      spec: {
        activeDeadlineSeconds: 60 * 60,
        affinity,
        automountServiceAccountToken: false,
        dnsPolicy: 'Default',
        entrypoint: workflow.spec.entrypoint,
        executor: { serviceAccountName: 'workflow' },
        parallelism: workflow.spec.parallelism,
        podMetadata: { labels: { 'tenlastic.com/app': name } },
        podPriorityClassName: namespaceName,
        serviceAccountName: 'workflow',
        templates,
        ttlStrategy: { secondsAfterCompletion: 3 * 60 * 60 },
        volumeClaimTemplates: [
          {
            metadata: { name: 'workspace' },
            spec: {
              accessModes: ['ReadWriteOnce'],
              resources: { requests: { storage: `${workflow.storage}` } },
              storageClassName: 'balanced-expandable',
            },
          },
        ],
      },
    });
  },
};

/**
 * Gets the manifest for a template.
 */
function getTemplateManifest(template: WorkflowSpecTemplateSchema, workflow: WorkflowDocument) {
  const t: any = new WorkflowSpecTemplateModel(template).toObject();
  if (!t.script) {
    return t;
  }

  t.artifactLocation = { archiveLogs: false };
  t.metadata = {
    labels: {
      ...KubernetesWorkflow.getLabels(workflow),
      'tenlastic.com/nodeId': `{{pod.name}}`,
      'tenlastic.com/role': 'Application',
    },
  };

  const sidecars = t.sidecars ? t.sidecars.length : 0;
  const cpu = workflow.cpu / (1 + sidecars);
  const memory = workflow.memory / (1 + sidecars);
  const resources = { cpu: `${cpu}`, memory: `${memory}` };

  t.script.resources = { limits: resources, requests: resources };
  t.script.volumeMounts = [{ mountPath: '/workspace/', name: 'workspace' }];

  if (t.sidecars) {
    t.sidecars = t.sidecars.map((s) => {
      s.resources = { limits: resources, requests: resources };
      return s;
    });
  }

  return t;
}
