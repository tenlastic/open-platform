import { V1Affinity } from '@kubernetes/client-node';
import { GameServerDocument, MatchDocument } from '@tenlastic/mongoose';

import { KubernetesGameServerApplication } from './application';
import { KubernetesGameServerNetworkPolicy } from './network-policy';
import { KubernetesGameServerSidecar } from './sidecar';

export const KubernetesGameServer = {
  delete: async (gameServer: GameServerDocument) => {
    await Promise.all([
      KubernetesGameServerApplication.delete(gameServer),
      KubernetesGameServerNetworkPolicy.delete(gameServer),
      KubernetesGameServerSidecar.delete(gameServer),
    ]);
  },
  getAffinity: (gameServer: GameServerDocument): V1Affinity => {
    return {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: gameServer.preemptible
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
  },
  getLabels: (gameServer: GameServerDocument) => {
    const name = KubernetesGameServer.getName(gameServer);

    return {
      'tenlastic.com/app': name,
      'tenlastic.com/gameServerId': `${gameServer._id}`,
      'tenlastic.com/namespaceId': `${gameServer.namespaceId}`,
    };
  },
  getName: (gameServer: GameServerDocument) => {
    return `game-server-${gameServer._id}`;
  },
  upsert: async (gameServer: GameServerDocument, match: MatchDocument) => {
    await Promise.all([
      KubernetesGameServerApplication.upsert(gameServer, match),
      KubernetesGameServerNetworkPolicy.upsert(gameServer),
      KubernetesGameServerSidecar.upsert(gameServer),
    ]);
  },
};
