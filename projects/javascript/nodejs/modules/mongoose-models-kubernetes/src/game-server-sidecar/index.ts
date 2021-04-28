import * as k8s from '@kubernetes/client-node';
import {
  clusterRoleStackApiV1,
  deploymentApiV1,
  roleStackApiV1,
  secretApiV1,
} from '@tenlastic/kubernetes';
import { GameServerDocument, GameServerEvent } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { KubernetesGameServer } from '../game-server';
import { KubernetesNamespace } from '../namespace';

GameServerEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesGameServerSidecar.delete(payload.fullDocument);
  } else {
    await KubernetesGameServerSidecar.upsert(payload.fullDocument);
  }
});

export const KubernetesGameServerSidecar = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServerSidecar.getName(gameServer);
    const namespace = KubernetesNamespace.getName(gameServer.namespaceId);

    /**
     * ======================
     * RBAC
     * ======================
     */
    await clusterRoleStackApiV1.delete(name, namespace);
    await roleStackApiV1.delete(name, namespace);

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, namespace);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, namespace);
  },
  getName(gameServer: GameServerDocument) {
    return `game-server-${gameServer._id}-sidecar`;
  },
  upsert: async (gameServer: GameServerDocument) => {
    const gameServerName = KubernetesGameServer.getName(gameServer);
    const name = KubernetesGameServerSidecar.getName(gameServer);
    const namespace = KubernetesNamespace.getName(gameServer.namespaceId);

    /**
     * ======================
     * RBAC
     * ======================
     */
    await clusterRoleStackApiV1.createOrReplace(namespace, {
      metadata: { name },
      rules: [
        {
          apiGroups: [''],
          resources: ['nodes'],
          verbs: ['get'],
        },
      ],
    });
    await roleStackApiV1.createOrReplace(namespace, {
      metadata: { name },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['nodes'],
          verbs: ['get'],
        },
      ],
    });

    /**
     * ======================
     * SECRET
     * ======================
     */
    const administrator = { roles: ['game-servers'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
    const labelSelector = `tenlastic.com/app=${gameServerName},tenlastic.com/role=application`;
    await secretApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': gameServerName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        GAME_SERVER_CONTAINER: 'main',
        GAME_SERVER_ENDPOINT: `http://api.default:3000/game-servers/${gameServer._id}`,
        GAME_SERVER_POD_LABEL_SELECTOR: labelSelector,
        GAME_SERVER_POD_NAMESPACE: namespace,
        LOG_CONTAINER: 'main',
        LOG_ENDPOINT: `http://api.default:3000/game-servers/${gameServer._id}/logs`,
        LOG_POD_LABEL_SELECTOR: labelSelector,
        LOG_POD_NAMESPACE: namespace,
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
    const livenessProbe: k8s.V1Probe = {
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            'tenlastic.com/app': gameServerName,
            'tenlastic.com/role': 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:12',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 120 },
              name: 'game-server-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir:
                '/usr/src/app/projects/javascript/nodejs/applications/game-server-sidecar/',
            },
          ],
          serviceAccountName: name,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          labels: {
            'tenlastic.com/app': gameServerName,
            'tenlastic.com/role': 'sidecar',
          },
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
          serviceAccountName: name,
        },
      };
    }

    await deploymentApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': gameServerName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            'tenlastic.com/app': gameServerName,
            'tenlastic.com/role': 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
};
