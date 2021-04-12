import * as k8s from '@kubernetes/client-node';
import {
  GameServer,
  GameServerDocument,
  GameServerEvent,
  GameServerRestartEvent,
} from '@tenlastic/mongoose-models';
import { URL } from 'url';

import { deploymentApiV1, networkPolicyApiV1, podApiV1, secretApiV1, serviceApiV1 } from '../apis';
import { KubernetesNamespace } from '../namespace';

GameServerEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesGameServer.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    GameServer.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesGameServer.upsert(payload.fullDocument);
  }
});
GameServerRestartEvent.sync(async gameServer => {
  await KubernetesGameServer.delete(gameServer);
  await KubernetesGameServer.upsert(gameServer);
});

export const KubernetesGameServer = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServer.getName(gameServer);
    const namespace = KubernetesNamespace.getName(gameServer.namespaceId);

    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    await secretApiV1.delete(`${name}-image-pull-secret`, namespace);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, namespace);

    /**
     * =======================
     * SERVICE
     * =======================
     */
    await serviceApiV1.delete(name, namespace);

    /**
     * =======================
     * DEPLOYMENT OR POD
     * =======================
     */
    await deploymentApiV1.delete(name, namespace);
    await podApiV1.delete(name, namespace);

    /**
     * =======================
     * DEVELOPMENT SERVICE
     * =======================
     */
    await serviceApiV1.delete(`${name}-node-port`, namespace);
  },
  getName(gameServer: GameServerDocument) {
    return `game-server-${gameServer._id}`;
  },
  upsert: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServer.getName(gameServer);
    const namespace = KubernetesNamespace.getName(gameServer.namespaceId);

    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    const secret = await secretApiV1.read('docker-registry-image-pull-secret', 'default');
    await secretApiV1.createOrReplace(namespace, {
      data: secret.body.data,
      metadata: {
        labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'image-pull-secret' },
        name: `${name}-image-pull-secret`,
      },
      type: secret.body.type,
    });

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace(namespace, {
      metadata: { name },
      spec: {
        egress: [
          {
            to: [
              {
                ipBlock: {
                  cidr: '0.0.0.0/0',
                  except: ['10.0.0.0/8', '172.0.0.0/8', '192.0.0.0/8'],
                },
              },
            ],
          },
        ],
        podSelector: {
          matchLabels: {
            'tenlastic.com/app': name,
            'tenlastic.com/role': 'application',
          },
        },
        policyTypes: ['Egress'],
      },
    });

    /**
     * =======================
     * SERVICE
     * =======================
     */
    await serviceApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
        name,
      },
      spec: {
        ports: [{ name: 'tcp', port: 7777 }],
        selector: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
      },
    });

    /**
     * =======================
     * DEPLOYMENT OR POD
     * =======================
     */
    const url = new URL(process.env.DOCKER_REGISTRY_URL);
    const image = `${url.host}/${gameServer.namespaceId}:${gameServer.buildId}`;

    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: gameServer.isPreemptible
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

    const max = 32767;
    const min = 30000;
    const hostPort = Math.round(Math.random() * (max - min) + min);

    const manifest: k8s.V1PodTemplateSpec = {
      metadata: {
        annotations: {
          'tenlastic.com/gameServerId': gameServer._id.toString(),
        },
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
        name,
      },
      spec: {
        affinity,
        automountServiceAccountToken: false,
        containers: [
          {
            env: [
              { name: 'GAME_SERVER_ID', value: gameServer._id.toHexString() },
              { name: 'GAME_SERVER_JSON', value: JSON.stringify(gameServer) },
            ],
            image,
            name: 'main',
            ports: [
              { containerPort: 7777, hostPort, protocol: 'TCP' },
              { containerPort: 7777, hostPort, protocol: 'UDP' },
            ],
            resources: {
              limits: {
                cpu: gameServer.cpu.toString(),
                memory: gameServer.memory.toString(),
              },
              requests: {
                cpu: gameServer.cpu.toString(),
                memory: gameServer.memory.toString(),
              },
            },
          },
        ],
        enableServiceLinks: false,
        imagePullSecrets: [{ name: `${name}-image-pull-secret` }],
        restartPolicy: gameServer.isPersistent ? 'Always' : 'Never',
      },
    };

    if (gameServer.isPersistent) {
      await deploymentApiV1.createOrReplace(namespace, {
        metadata: {
          labels: {
            'tenlastic.com/app': name,
            'tenlastic.com/role': 'application',
          },
          name,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'application',
            },
          },
          template: manifest,
        },
      });
    } else {
      await podApiV1.createOrReplace(namespace, manifest);
    }

    /**
     * =======================
     * DEVELOPMENT SERVICE
     * =======================
     */
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      await serviceApiV1.createOrReplace(namespace, {
        metadata: {
          labels: {
            'tenlastic.com/app': name,
            'tenlastic.com/role': 'application',
          },
          name: `${name}-node-port`,
        },
        spec: {
          ports: [
            { name: 'tcp', nodePort: hostPort, port: 7777, protocol: 'TCP' },
            { name: 'udp', nodePort: hostPort, port: 7777, protocol: 'UDP' },
          ],
          selector: {
            'tenlastic.com/app': name,
            'tenlastic.com/role': 'application',
          },
          type: 'NodePort',
        },
      });
    }
  },
};