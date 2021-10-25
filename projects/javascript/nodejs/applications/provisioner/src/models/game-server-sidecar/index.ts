import { deploymentApiV1, secretApiV1, V1PodTemplateSpec, V1Probe } from '@tenlastic/kubernetes';
import {
  GameServer,
  GameServerDocument,
  Namespace,
  NamespaceRole,
} from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { subscribe } from '../../subscribe';
import { KubernetesGameServer } from '../game-server';

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
  subscribe: () => {
    return subscribe<GameServerDocument>(GameServer, 'game-server-sidecar', async payload => {
      if (payload.operationType === 'delete') {
        console.log(`Deleting Game Server Sidecar: ${payload.fullDocument._id}.`);
        await KubernetesGameServerSidecar.delete(payload.fullDocument);
      } else if (
        payload.operationType === 'insert' ||
        GameServer.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
      ) {
        console.log(`Upserting Game Server Sidecar: ${payload.fullDocument._id}.`);
        await KubernetesGameServerSidecar.upsert(payload.fullDocument);
      }
    });
  },
  upsert: async (gameServer: GameServerDocument) => {
    const gameServerLabels = KubernetesGameServer.getLabels(gameServer);
    const gameServerName = KubernetesGameServer.getName(gameServer);
    const name = KubernetesGameServerSidecar.getName(gameServer);

    /**
     * ======================
     * SECRET
     * ======================
     */
    const accessToken = Namespace.getAccessToken(gameServer.namespaceId, [NamespaceRole.Games]);
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...gameServerLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        GAME_SERVER_CONTAINER: 'main',
        GAME_SERVER_ENDPOINT: `http://api.static:3000/game-servers/${gameServer._id}`,
        GAME_SERVER_PERSISTENT: gameServer.persistent ? 'true' : 'false',
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
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/projects/')) {
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
              livenessProbe,
              name: 'game-server-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [
                {
                  mountPath: '/usr/src/projects/javascript/node_modules/',
                  name: 'node-modules',
                },
                { mountPath: '/usr/src/', name: 'source' },
              ],
              workingDir: '/usr/src/projects/javascript/nodejs/applications/game-server-sidecar/',
            },
          ],
          serviceAccountName: 'game-server-sidecar',
          volumes: [
            { name: 'node-modules', persistentVolumeClaim: { claimName: 'node-modules' } },
            { hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'source' },
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
              resources: { requests: { cpu: '50m', memory: '50M' } },
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
