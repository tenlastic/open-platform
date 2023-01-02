import { V1EnvVar, V1PodTemplateSpec } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { WorkflowDocument } from '@tenlastic/mongoose';

import { version } from '../../package.json';
import { KubernetesNamespace } from './namespace';
import { KubernetesWorkflow } from './workflow';

export const KubernetesWorkflowSidecar = {
  delete: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName(workflow: WorkflowDocument) {
    return `workflow-${workflow._id}-sidecar`;
  },
  upsert: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);
    const namespaceName = KubernetesNamespace.getName(workflow.namespaceId);
    const workflowLabels = KubernetesWorkflow.getLabels(workflow);
    const workflowName = KubernetesWorkflow.getName(workflow);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const { _id, namespaceId } = workflow;
    const host = `${namespaceName}-api.dynamic:3000`;
    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: 'tenlastic.com/low-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
    };
    const env: V1EnvVar[] = [
      {
        name: 'API_KEY',
        valueFrom: { secretKeyRef: { key: 'WORKFLOWS', name: `${namespaceName}-api-keys` } },
      },
      { name: 'ENDPOINT', value: `http://${host}/namespaces/${namespaceId}/workflows/${_id}` },
      { name: 'WORKFLOW_NAME', value: workflowName },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...workflowLabels, 'tenlastic.com/role': 'Sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'tenlastic/node-development:latest',
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/workflow-status-sidecar/',
            },
          ],
          serviceAccountName: 'workflow-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: { ...workflowLabels, 'tenlastic.com/role': 'Sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/workflow-status-sidecar:${version}`,
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
            },
          ],
          serviceAccountName: 'workflow-sidecar',
        },
      };
    }

    await deploymentApiV1.delete(name, 'dynamic');
    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...workflowLabels, 'tenlastic.com/role': 'Sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...workflowLabels, 'tenlastic.com/role': 'Sidecar' } },
        template: manifest,
      },
    });
  },
};
