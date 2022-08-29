import { V1Affinity, V1EnvFromSource, V1PodTemplateSpec, V1Probe } from '@kubernetes/client-node';
import { deploymentApiV1, secretApiV1 } from '@tenlastic/kubernetes';
import { Authorization, AuthorizationRole, GameServerDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';

import { KubernetesGameServer } from '../game-server';
import { KubernetesNamespace } from '../namespace';

const chance = new Chance();

export const KubernetesGameServerSidecar = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServerSidecar.getName(gameServer);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    await Authorization.findOneAndDelete({ name, namespaceId: gameServer.namespaceId });

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName: (gameServer: GameServerDocument) => {
    return `game-server-${gameServer._id}-sidecar`;
  },
  upsert: async (gameServer: GameServerDocument) => {
    const gameServerLabels = KubernetesGameServer.getLabels(gameServer);
    const gameServerName = KubernetesGameServer.getName(gameServer);
    const name = KubernetesGameServerSidecar.getName(gameServer);
    const namespaceName = KubernetesNamespace.getName(gameServer.namespaceId);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    const apiKey = chance.hash({ length: 64 });
    try {
      await Authorization.create({
        apiKey,
        name,
        namespaceId: gameServer.namespaceId,
        roles: [AuthorizationRole.GameServersReadWrite],
        system: true,
      });
    } catch (e) {
      if (e.name !== 'UniqueError') {
        throw e;
      }
    }

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.createOrRead('dynamic', {
      metadata: {
        labels: { ...gameServerLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
        API_KEY: apiKey,
        API_URL: `http://${namespaceName}-api.dynamic:3000`,
        GAME_SERVER_CONTAINER: 'main',
        GAME_SERVER_JSON: JSON.stringify(gameServer),
        GAME_SERVER_POD_LABEL_SELECTOR: `tenlastic.com/app=${gameServerName}`,
      },
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const affinity = {
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
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...gameServerLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:14',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'game-server-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/game-server-sidecar/',
            },
          ],
          serviceAccountName: 'game-server-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      const { version } = require('../../../package.json');

      manifest = {
        metadata: {
          labels: { ...gameServerLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/game-server-sidecar:${version}`,
              livenessProbe,
              name: 'game-server-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
            },
          ],
          serviceAccountName: 'game-server-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...gameServerLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...gameServerLabels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
