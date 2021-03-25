import * as k8s from '@kubernetes/client-node';
import { URL } from 'url';

import {
  GameServer,
  GameServerDocument,
  GameServerEvent,
  GameServerRestartEvent,
} from '../../models/game-server';
import { NamespaceDocument } from '../../models/namespace';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);

GameServerEvent.sync(async payload => {
  const gameServer = payload.fullDocument;

  if (!gameServer.populated('namespaceDocument')) {
    await gameServer.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesGameServer.delete(gameServer, gameServer.namespaceDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesGameServer.create(gameServer, gameServer.namespaceDocument);
  } else if (
    payload.operationType === 'update' &&
    GameServer.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesGameServer.delete(gameServer, gameServer.namespaceDocument);
    await KubernetesGameServer.create(gameServer, gameServer.namespaceDocument);
  }
});
GameServerRestartEvent.sync(async gameServer => {
  if (!gameServer.populated('namespaceDocument')) {
    await gameServer.populate('namespaceDocument').execPopulate();
  }

  await KubernetesGameServer.delete(gameServer, gameServer.namespaceDocument);
  await KubernetesGameServer.create(gameServer, gameServer.namespaceDocument);
});

export const KubernetesGameServer = {
  create: async (gameServer: GameServerDocument, namespace: NamespaceDocument) => {
    const name = KubernetesGameServer.getName(gameServer);

    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    const secret = await coreV1.readNamespacedSecret(
      'docker-registry-image-pull-secret',
      'default',
    );
    await coreV1.createNamespacedSecret(namespace.kubernetesNamespace, {
      data: secret.body.data,
      metadata: { name },
      type: secret.body.type,
    });

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkingV1.createNamespacedNetworkPolicy(namespace.kubernetesNamespace, {
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
            app: name,
            role: 'application',
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
    await coreV1.createNamespacedService(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          app: name,
          role: 'application',
        },
        name,
      },
      spec: {
        ports: [
          {
            name: 'tcp',
            port: 7777,
          },
        ],
        selector: {
          app: name,
          role: 'application',
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
          app: name,
          role: 'application',
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
        imagePullSecrets: [{ name }],
        restartPolicy: gameServer.isPersistent ? 'Always' : 'Never',
      },
    };

    if (gameServer.isPersistent) {
      await appsV1.createNamespacedDeployment(namespace.kubernetesNamespace, {
        metadata: {
          labels: {
            app: name,
            role: 'application',
          },
          name,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: name,
              role: 'application',
            },
          },
          template: manifest,
        },
      });
    } else {
      await coreV1.createNamespacedPod(namespace.kubernetesNamespace, manifest);
    }

    /**
     * =======================
     * DEVELOPMENT SERVICE
     * =======================
     */
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      await coreV1.createNamespacedService(namespace.kubernetesNamespace, {
        metadata: {
          labels: {
            app: name,
            role: 'application',
          },
          name: `${name}-node-port`,
        },
        spec: {
          ports: [
            { name: 'tcp', nodePort: hostPort, port: 7777, protocol: 'TCP' },
            { name: 'udp', nodePort: hostPort, port: 7777, protocol: 'UDP' },
          ],
          selector: {
            app: name,
            role: 'application',
          },
          type: 'NodePort',
        },
      });
    }
  },
  delete: async (gameServer: GameServerDocument, namespace: NamespaceDocument) => {
    const name = KubernetesGameServer.getName(gameServer);

    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    try {
      await coreV1.deleteNamespacedSecret(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    try {
      await networkingV1.deleteNamespacedNetworkPolicy(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * =======================
     * SERVICE
     * =======================
     */
    try {
      await coreV1.deleteNamespacedService(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * =======================
     * DEPLOYMENT OR POD
     * =======================
     */
    try {
      await appsV1.deleteNamespacedDeployment(name, namespace.kubernetesNamespace);
    } catch {}

    try {
      await coreV1.deleteNamespacedPod(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * =======================
     * DEVELOPMENT SERVICE
     * =======================
     */
    try {
      await coreV1.deleteNamespacedService(`${name}-node-port`, namespace.kubernetesNamespace);
    } catch {}
  },
  getName(gameServer: GameServerDocument) {
    return `game-server-${gameServer._id}`;
  },
};
