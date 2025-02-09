import { networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { QueueDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from '../namespace';
import { KubernetesQueue } from './';

export const KubernetesQueueNetworkPolicy = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

    await networkPolicyApiV1.delete(name, 'dynamic');
  },
  upsert: async (queue: QueueDocument) => {
    const labels = KubernetesQueue.getLabels(queue);
    const name = KubernetesQueue.getName(queue);
    const namespaceName = KubernetesNamespace.getName(queue.namespaceId);

    return networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [
          {
            to: [
              { podSelector: { matchLabels: { 'tenlastic.com/app': namespaceName } } },
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
