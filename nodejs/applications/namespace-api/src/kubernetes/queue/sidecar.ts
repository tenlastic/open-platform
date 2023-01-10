import { V1EnvVar } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { QueueDocument, QueueStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from '../namespace';
import { KubernetesQueue } from './';

export const KubernetesQueueSidecar = {
  delete: async (queue: QueueDocument) => {
    const name = getName(queue);

    await deploymentApiV1.delete(name, 'dynamic');
  },
  upsert: async (queue: QueueDocument) => {
    const labels = KubernetesQueue.getLabels(queue);
    const name = getName(queue);

    await deploymentApiV1.delete(name, 'dynamic');

    return deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
        },
        template: getPodTemplate(queue),
      },
    });
  },
};

function getName(queue: QueueDocument) {
  const name = KubernetesQueue.getName(queue);
  return `${name}-sidecar`;
}

function getPodTemplate(queue: QueueDocument) {
  const affinity = KubernetesQueue.getAffinity(queue);
  const labels = KubernetesQueue.getLabels(queue);
  const name = getName(queue);
  const namespaceName = KubernetesNamespace.getName(queue.namespaceId);
  const queueName = KubernetesQueue.getName(queue);

  const apiHost = `http://${namespaceName}-api.dynamic:3000`;
  const env: V1EnvVar[] = [
    {
      name: 'API_KEY',
      valueFrom: { secretKeyRef: { key: 'QUEUES', name: `${namespaceName}-api-keys` } },
    },
    { name: 'ENDPOINT', value: `${apiHost}/namespaces/${queue.namespaceId}/queues/${queue._id}` },
    { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${queueName}` },
  ];

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env,
            image: 'tenlastic/node-development:latest',
            name: 'status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: '/usr/src/nodejs/applications/status-sidecar/',
          },
        ],
        serviceAccountName: 'queue-sidecar',
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env,
            image: `tenlastic/status-sidecar:${version}`,
            name: 'status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
          },
        ],
        serviceAccountName: 'queue-sidecar',
      },
    };
  }
}
