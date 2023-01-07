import { V1Affinity, V1EnvFromSource, V1EnvVar, V1PodTemplateSpec } from '@kubernetes/client-node';
import { networkPolicyApiV1, statefulSetApiV1 } from '@tenlastic/kubernetes';
import { QueueDocument, QueueStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../package.json';
import { KubernetesNamespace } from './namespace';

export const KubernetesQueue = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    await statefulSetApiV1.delete(name, 'dynamic');
  },
  getLabels: (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${queue.namespaceId}`,
      'tenlastic.com/queueId': `${queue._id}`,
    };
  },
  getName: (queue: QueueDocument) => {
    return `queue-${queue._id}`;
  },
  upsert: async (queue: QueueDocument) => {
    const labels = KubernetesQueue.getLabels(queue);
    const name = KubernetesQueue.getName(queue);
    const namespaceName = KubernetesNamespace.getName(queue.namespaceId);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [
          {
            to: [
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'redis' } },
              },
              { podSelector: { matchLabels: { 'tenlastic.com/app': name } } },
            ],
          },
        ],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
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

    const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
    let manifest: V1PodTemplateSpec;
    if (isDevelopment) {
      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Application },
          name,
        },
        spec: {
          affinity: getAffinity(queue, QueueStatusComponentName.Application),
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              envFrom,
              image: `tenlastic/node-development:latest`,
              name: 'main',
              resources: { requests: resources.requests },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/queue/',
            },
          ],
          priorityClassName: namespaceName,
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': QueueStatusComponentName.Application },
          name,
        },
        spec: {
          affinity: getAffinity(queue, QueueStatusComponentName.Application),
          containers: [
            {
              env,
              envFrom,
              image: `tenlastic/queue:${version}`,
              name: 'main',
              resources,
            },
          ],
          priorityClassName: namespaceName,
        },
      };
    }

    await statefulSetApiV1.delete(name, 'dynamic');
    await statefulSetApiV1.create('dynamic', {
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
        template: manifest,
      },
    });
  },
};

function getAffinity(queue: QueueDocument, role: QueueStatusComponentName): V1Affinity {
  const name = KubernetesQueue.getName(queue);

  return {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: queue.preemptible
                  ? 'tenlastic.com/low-priority'
                  : 'tenlastic.com/high-priority',
                operator: 'Exists',
              },
            ],
          },
        ],
      },
    },
    podAntiAffinity: {
      preferredDuringSchedulingIgnoredDuringExecution: [
        {
          podAffinityTerm: {
            labelSelector: {
              matchExpressions: [
                { key: 'tenlastic.com/app', operator: 'In', values: [name] },
                { key: 'tenlastic.com/role', operator: 'In', values: [role] },
              ],
            },
            topologyKey: 'kubernetes.io/hostname',
          },
          weight: 1,
        },
      ],
    },
  };
}
