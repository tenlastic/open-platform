import { V1EnvFromSource, V1EnvVar, V1PodTemplateSpec, V1Probe } from '@kubernetes/client-node';
import { deploymentApiV1, secretApiV1 } from '@tenlastic/kubernetes';

import { GameServerDocument } from '../mongodb';
import { KubernetesGameServer } from './game-server';
import { KubernetesNamespace } from './namespace';

export const KubernetesGameServerSidecar = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServerSidecar.getName(gameServer);

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
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...gameServerLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
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
    const env: V1EnvVar[] = [
      {
        name: 'API_KEY',
        valueFrom: { secretKeyRef: { key: 'GAME_SERVERS', name: `${namespaceName}-api-keys` } },
      },
    ];
    const envFrom: V1EnvFromSource[] = [{ secretRef: { name } }];
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
              env,
              envFrom,
              image: 'tenlastic/node-development:latest',
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
              env,
              envFrom,
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
