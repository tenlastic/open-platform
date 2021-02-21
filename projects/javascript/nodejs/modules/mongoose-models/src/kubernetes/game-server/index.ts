import * as k8s from '@kubernetes/client-node';
import { URL } from 'url';

import {
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

GameServerEvent.on(async payload => {
  const gameServer = payload.fullDocument;

  if (!gameServer.populated('namespaceDocument')) {
    await gameServer.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesGameServer.delete(gameServer, gameServer.namespaceDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesGameServer.create(gameServer, gameServer.namespaceDocument);
  } else if (payload.operationType === 'update') {
    await KubernetesGameServer.delete(gameServer, gameServer.namespaceDocument);
    await KubernetesGameServer.create(gameServer, gameServer.namespaceDocument);
  }
});
GameServerRestartEvent.on(async gameServer => {
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
        type: 'NodePort',
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
            ports: [{ containerPort: 7777 }],
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
        dnsPolicy: 'Default',
        enableServiceLinks: false,
        imagePullSecrets: [{ name: 'docker-registry-image-pull-secret' }],
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
  },
  getName(gameServer: GameServerDocument) {
    return `game-server-${gameServer._id}`;
  },
};
