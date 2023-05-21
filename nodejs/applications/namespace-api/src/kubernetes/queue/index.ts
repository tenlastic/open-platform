import { V1Affinity } from '@kubernetes/client-node';
import { QueueDocument, QueueStatusComponentName } from '@tenlastic/mongoose';

import { KubernetesQueueApplication } from './application';
import { KubernetesQueueNetworkPolicy } from './network-policy';
import { KubernetesQueueSidecar } from './sidecar';

export const KubernetesQueue = {
  delete: async (queue: QueueDocument) => {
    await Promise.all([
      KubernetesQueueApplication.delete(queue),
      KubernetesQueueNetworkPolicy.delete(queue),
      KubernetesQueueSidecar.delete(queue),
    ]);
  },
  getAffinity: (queue: QueueDocument, role?: QueueStatusComponentName) => {
    const name = KubernetesQueue.getName(queue);

    const affinity: V1Affinity = {
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
    };

    if (role) {
      affinity.podAntiAffinity = {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            labelSelector: {
              matchExpressions: [
                { key: 'tenlastic.com/app', operator: 'In', values: [name] },
                { key: 'tenlastic.com/role', operator: 'In', values: [role] },
              ],
            },
            topologyKey: 'kubernetes.io/hostname',
          },
        ],
      };
    }

    return affinity;
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
    await Promise.all([
      KubernetesQueueApplication.upsert(queue),
      KubernetesQueueNetworkPolicy.upsert(queue),
      KubernetesQueueSidecar.upsert(queue),
    ]);
  },
};
