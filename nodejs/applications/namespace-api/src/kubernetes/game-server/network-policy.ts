import { networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { GameServerDocument } from '@tenlastic/mongoose';

import { KubernetesGameServer } from './';

export const KubernetesGameServerNetworkPolicy = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServer.getName(gameServer);

    await networkPolicyApiV1.delete(name, 'dynamic');
  },
  upsert: async (gameServer: GameServerDocument) => {
    const labels = KubernetesGameServer.getLabels(gameServer);
    const name = KubernetesGameServer.getName(gameServer);

    return networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });
  },
};
