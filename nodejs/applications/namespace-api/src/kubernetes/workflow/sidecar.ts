import { V1EnvVar } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { WorkflowDocument } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from '../namespace';
import { KubernetesWorkflow } from './';

export const KubernetesWorkflowSidecar = {
  delete: async (workflow: WorkflowDocument) => {
    const name = getName(workflow);

    await deploymentApiV1.delete(name, 'dynamic');
  },
  upsert: async (workflow: WorkflowDocument) => {
    const labels = KubernetesWorkflow.getLabels(workflow);
    const name = getName(workflow);

    await deploymentApiV1.delete(name, 'dynamic');

    return deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'Sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'Sidecar' } },
        template: getPodTemplate(workflow),
      },
    });
  },
};

function getName(workflow: WorkflowDocument) {
  const name = KubernetesWorkflow.getName(workflow);
  return `${name}-sidecar`;
}

function getPodTemplate(workflow: WorkflowDocument) {
  const labels = KubernetesWorkflow.getLabels(workflow);
  const name = getName(workflow);
  const namespaceName = KubernetesNamespace.getName(workflow.namespaceId);
  const workflowName = KubernetesWorkflow.getName(workflow);

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

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'Sidecar' },
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
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'Sidecar' },
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
}
