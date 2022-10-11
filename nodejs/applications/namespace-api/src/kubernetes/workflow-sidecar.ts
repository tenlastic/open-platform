import { V1EnvFromSource, V1EnvVar, V1PodTemplateSpec, V1Probe } from '@kubernetes/client-node';
import { deploymentApiV1, secretApiV1 } from '@tenlastic/kubernetes';

import { version } from '../../package.json';
import { WorkflowDocument } from '../mongodb';
import { KubernetesNamespace } from './namespace';
import { KubernetesWorkflow } from './workflow';

export const KubernetesWorkflowSidecar = {
  delete: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, 'dynamic');

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
     * SECRET
     * ======================
     */
    const { _id, namespaceId } = workflow;
    const host = `${namespaceName}-api.dynamic:3000`;
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
        WORKFLOW_ENDPOINT: `http://${host}/namespaces/${namespaceId}/workflows/${_id}`,
        WORKFLOW_NAME: workflowName,
      },
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
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
    ];
    const envFrom: V1EnvFromSource[] = [{ secretRef: { name } }];
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: '/probes/liveness', port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              envFrom,
              image: 'tenlastic/node-development:latest',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
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
          labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              envFrom,
              image: `tenlastic/workflow-status-sidecar:${version}`,
              livenessProbe,
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
            },
          ],
          serviceAccountName: 'workflow-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
