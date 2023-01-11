import { networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { BuildDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from '../namespace';
import { KubernetesBuild } from './';

export const KubernetesBuildNetworkPolicy = {
  delete: async (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);

    await networkPolicyApiV1.delete(name, 'dynamic');
  },
  upsert: async (build: BuildDocument) => {
    const labels = KubernetesBuild.getLabels(build);
    const name = KubernetesBuild.getName(build);
    const namespaceName = KubernetesNamespace.getName(build.namespaceId);

    return networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'Application' }, name },
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
