import { roleStackApiV1, workflowApiV1 } from '@tenlastic/kubernetes';
import {
  WorkflowDocument,
  WorkflowEvent,
  WorkflowSpecTemplate,
  WorkflowSpecTemplateSchema,
} from '@tenlastic/mongoose-models';

import { KubernetesNamespace } from '../namespace';

WorkflowEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesWorkflow.delete(payload.fullDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesWorkflow.upsert(payload.fullDocument);
  }
});

export const KubernetesWorkflow = {
  delete: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);
    const namespace = KubernetesNamespace.getName(workflow.namespaceId);

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await workflowApiV1.delete(name, namespace);
  },
  getName(workflow: WorkflowDocument) {
    return `workflow-${workflow._id}`;
  },
  upsert: async (workflow: WorkflowDocument) => {
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
    const response = await workflowApiV1.createOrReplace(namespace, {
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
          secondsAfterCompletion: 15 * 60,
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
    });

    /**
     * ======================
     * RBAC
     * ======================
     */
    await roleStackApiV1.createOrReplace(namespace, {
      metadata: {
        name,
        ownerReferences: [
          {
            apiVersion: 'argoproj.io/v1alpha1',
            controller: true,
            kind: 'Workflow',
            name,
            uid: response.body.metadata.uid,
          },
        ],
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
      'tenlastic.com/namespaceId': workflow.namespaceId.toString(),
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
