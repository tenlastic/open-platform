import * as k8s from '@kubernetes/client-node';

import { GameServerDocument } from '../../models';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);

export const GameServer = {
  create: async (gameServer: GameServerDocument) => {
    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    const secret = await coreV1.readNamespacedSecret(
      'docker-registry-image-pull-secret',
      'default',
    );
    await coreV1.createNamespacedSecret(gameServer.kubernetesNamespace, {
      data: secret.body.data,
      metadata: { name: secret.body.metadata.name },
      type: secret.body.type,
    });

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkingV1.createNamespacedNetworkPolicy(gameServer.kubernetesNamespace, {
      metadata: {
        name: gameServer.kubernetesName,
      },
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
            app: gameServer.kubernetesName,
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
    await coreV1.createNamespacedService(gameServer.kubernetesNamespace, {
      metadata: {
        labels: {
          app: gameServer.kubernetesName,
        },
        name: gameServer.kubernetesName,
      },
      spec: {
        ports: [
          {
            name: 'tcp',
            port: 7777,
          },
        ],
        selector: {
          app: gameServer.kubernetesName,
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

    const applicationPodManifest: k8s.V1PodTemplateSpec = {
      metadata: {
        labels: {
          app: gameServer.kubernetesName,
          role: 'application',
        },
        name: `${gameServer.kubernetesName}-application`,
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
            name: 'application',
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
      await appsV1.createNamespacedDeployment(gameServer.kubernetesNamespace, {
        metadata: {
          labels: {
            app: gameServer.kubernetesName,
            role: 'application',
          },
          name: `${gameServer.kubernetesName}-application`,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: gameServer.kubernetesName,
              role: 'application',
            },
          },
          template: applicationPodManifest,
        },
      });
    } else {
      await coreV1.createNamespacedPod(gameServer.kubernetesNamespace, applicationPodManifest);
    }
  },
  delete: async (gameServer: GameServerDocument) => {
    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    try {
      await coreV1.deleteNamespacedSecret(
        'docker-registry-image-pull-secret',
        gameServer.kubernetesNamespace,
      );
    } catch {}

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    try {
      await networkingV1.deleteNamespacedNetworkPolicy(
        gameServer.kubernetesName,
        gameServer.kubernetesNamespace,
      );
    } catch {}

    /**
     * =======================
     * SERVICE
     * =======================
     */
    try {
      await coreV1.deleteNamespacedService(
        gameServer.kubernetesName,
        gameServer.kubernetesNamespace,
      );
    } catch {}

    /**
     * =======================
     * DEPLOYMENT OR POD
     * =======================
     */
    try {
      await appsV1.deleteNamespacedDeployment(
        `${gameServer.kubernetesName}-application`,
        gameServer.kubernetesNamespace,
      );
    } catch {}

    try {
      await coreV1.deleteNamespacedPod(
        `${gameServer.kubernetesName}-application`,
        gameServer.kubernetesNamespace,
      );
    } catch {}
  },
};
