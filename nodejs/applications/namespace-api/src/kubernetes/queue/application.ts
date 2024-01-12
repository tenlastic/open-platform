import { V1EnvFromSource, V1EnvVar } from '@kubernetes/client-node';
import { statefulSetApiV1 } from '@tenlastic/kubernetes';
import { QueueDocument, QueueStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from '../namespace';
import { KubernetesQueue } from './';

export const KubernetesQueueApplication = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

    await statefulSetApiV1.delete(name, 'dynamic');
  },
  upsert: async (queue: QueueDocument) => {
    const labels = KubernetesQueue.getLabels(queue);
    const name = KubernetesQueue.getName(queue);

    await statefulSetApiV1.delete(name, 'dynamic');

    return statefulSetApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Application },
        name,
      },
      spec: {
        replicas: queue.replicas,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Application },
        },
        serviceName: name,
        template: getPodTemplate(queue),
      },
    });
  },
};

function getPodTemplate(queue: QueueDocument) {
  const affinity = KubernetesQueue.getAffinity(queue, QueueStatusComponentName.Application);
  const labels = KubernetesQueue.getLabels(queue);
  const name = KubernetesQueue.getName(queue);
  const namespaceName = KubernetesNamespace.getName(queue.namespaceId);

  const env: V1EnvVar[] = [
    {
      name: 'API_KEY',
      valueFrom: { secretKeyRef: { key: 'QUEUES', name: `${namespaceName}-api-keys` } },
    },
    { name: 'API_URL', value: `http://${namespaceName}-api.dynamic:3000` },
    { name: 'NAMESPACE_ID', value: `${queue.namespaceId}` },
    { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
    { name: 'QUEUE_ID', value: `${queue._id}` },
    { name: 'WSS_URL', value: `ws://${namespaceName}-api.dynamic:3000` },
  ];
  const envFrom: V1EnvFromSource[] = [
    { secretRef: { name: 'nodejs' } },
    { secretRef: { name: namespaceName } },
  ];
  const resources = {
    limits: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
    requests: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
  };

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Application },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env,
            envFrom,
            image: `tenlastic/node-development:latest`,
            imagePullPolicy: 'IfNotPresent',
            name: 'queue',
            resources: { requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: '/usr/src/nodejs/applications/queue/',
          },
        ],
        priorityClassName: namespaceName,
        volumes: [
          { hostPath: { path: '/usr/src/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Application },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env,
            envFrom,
            image: `tenlastic/queue:${version}`,
            name: 'queue',
            resources,
          },
        ],
        priorityClassName: namespaceName,
      },
    };
  }
}
