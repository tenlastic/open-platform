import { networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { QueueDocument } from '@tenlastic/mongoose';

import { KubernetesQueue } from './';

export const KubernetesQueueNetworkPolicy = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

    await networkPolicyApiV1.delete(name, 'dynamic');
  },
  upsert: async (queue: QueueDocument) => {
    const labels = KubernetesQueue.getLabels(queue);
    const name = KubernetesQueue.getName(queue);

    return networkPolicyApiV1.createOrReplace('dynamic', {
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
  },
};
