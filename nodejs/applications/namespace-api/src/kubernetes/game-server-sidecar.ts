import { V1EnvVar, V1PodTemplateSpec } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';

import { version } from '../../package.json';
import { GameServerDocument, GameServerStatusComponentName } from '../mongodb';
import { KubernetesGameServer } from './game-server';
import { KubernetesNamespace } from './namespace';

export const KubernetesGameServerSidecar = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServerSidecar.getName(gameServer);

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
     * DEPLOYMENT
     * ======================
     */
    const apiHost = `http://${namespaceName}-api.dynamic:3000`;
    const applicationSelector = `tenlastic.com/role=${GameServerStatusComponentName.Application}`;
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
      { name: 'CONTAINER', value: 'main' },
      {
        name: 'ENDPOINT',
        value: `${apiHost}/namespaces/${gameServer.namespaceId}/game-servers/${gameServer._id}`,
      },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: {
            ...gameServerLabels,
            'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env: [
                ...env,
                {
                  name: 'LABEL_SELECTOR',
                  value: `tenlastic.com/app=${gameServerName},${applicationSelector}`,
                },
              ],
              image: 'tenlastic/node-development:latest',
              name: 'endpoints-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/endpoints-sidecar/',
            },
            {
              command: ['npm', 'run', 'start'],
              env: [
                ...env,
                { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${gameServerName}` },
              ],
              image: 'tenlastic/node-development:latest',
              name: 'status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/status-sidecar/',
            },
          ],
          serviceAccountName: 'game-server-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: {
            ...gameServerLabels,
            'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env: [
                ...env,
                {
                  name: 'LABEL_SELECTOR',
                  value: `tenlastic.com/app=${gameServerName},${applicationSelector}`,
                },
              ],
              image: `tenlastic/endpoints-sidecar:${version}`,
              name: 'endpoints-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
            },
            {
              env: [
                ...env,
                { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${gameServerName}` },
              ],
              image: `tenlastic/status-sidecar:${version}`,
              name: 'status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
            },
          ],
          serviceAccountName: 'game-server-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: {
          ...gameServerLabels,
          'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
        },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            ...gameServerLabels,
            'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
          },
        },
        template: manifest,
      },
    });
  },
};
