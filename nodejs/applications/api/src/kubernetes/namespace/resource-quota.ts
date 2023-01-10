import { resourceQuotaApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from './';

export const KubernetesNamespaceResourceQuota = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    return resourceQuotaApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        hard: { cpu: `${namespace.limits.cpu}`, memory: `${namespace.limits.memory}` },
        scopeSelector: {
          matchExpressions: [{ operator: 'In', scopeName: 'PriorityClass', values: [name] }],
        },
      },
    });
  },
};
