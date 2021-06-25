import { workflowApiV1 } from '@tenlastic/kubernetes';
import {
  Workflow,
  WorkflowDocument,
  WorkflowSpecTemplate,
  WorkflowSpecTemplateSchema,
} from '@tenlastic/mongoose-models';

import { subscribe } from '../../subscribe';
import { KubernetesNamespace } from '../namespace';

export const KubernetesWorkflow = {
  delete: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await workflowApiV1.delete(name, 'dynamic');
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
  subscribe: () => {
    return subscribe<WorkflowDocument>(Workflow, 'workflow', async payload => {
      if (payload.operationType === 'delete') {
        console.log(`Deleting Workflow: ${payload.fullDocument._id}.`);
        await KubernetesWorkflow.delete(payload.fullDocument);
      } else if (payload.operationType === 'insert') {
        console.log(`Creating Workflow: ${payload.fullDocument._id}.`);
        await KubernetesWorkflow.upsert(payload.fullDocument);
      }
    });
  },
  upsert: async (workflow: WorkflowDocument) => {
    const labels = KubernetesWorkflow.getLabels(workflow);
    const name = KubernetesWorkflow.getName(workflow);
    const namespace = KubernetesNamespace.getName(workflow.namespaceId);

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
    };
    const templates = workflow.spec.templates.map(t => getTemplateManifest(t, workflow));
    await workflowApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: {
          ...labels,
          'tenlastic.com/role': 'application',
          'workflows.argoproj.io/controller-instanceid': namespace,
        },
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
        serviceAccountName: 'workflow',
        templates,
        ttlStrategy: { secondsAfterCompletion: 15 * 60 },
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
  const t = new WorkflowSpecTemplate(template).toObject();
  if (!t.script) {
    return t;
  }

  t.artifactLocation = { archiveLogs: false };
  t.metadata = {
    labels: {
      ...KubernetesWorkflow.getLabels(workflow),
      'tenlastic.com/nodeId': `{{pod.name}}`,
      'tenlastic.com/role': 'application',
    },
  };

  const sidecars = t.sidecars ? t.sidecars.length : 0;
  const cpu = workflow.cpu / (1 + sidecars);
  const memory = workflow.memory / (1 + sidecars);
  const resources = { cpu: `${cpu}`, memory: `${memory}` };

  t.script.resources = { limits: resources, requests: resources };
  t.script.volumeMounts = [{ mountPath: '/workspace/', name: 'workspace' }];

  if (t.sidecars) {
    t.sidecars = t.sidecars.map(s => {
      s.resources = { limits: resources, requests: resources };
      return s;
    });
  }

  return t;
}
