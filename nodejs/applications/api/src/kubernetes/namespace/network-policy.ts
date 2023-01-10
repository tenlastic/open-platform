import { networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from './';

export const KubernetesNamespaceNetworkPolicy = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    return networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [
          {
            to: [
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'mongodb' } },
              },
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'nats' } },
              },
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
