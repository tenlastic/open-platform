import * as k8s from '@kubernetes/client-node';
import { Queue, QueueDocument, QueueEvent } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { URL } from 'url';

import { helmReleaseApiV1, networkPolicyApiV1, secretApiV1, statefulSetApiV1 } from '../apis';
import { KubernetesNamespace } from '../namespace';

const chance = new Chance();

QueueEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesQueue.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    Queue.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesQueue.upsert(payload.fullDocument);
  }
});

export const KubernetesQueue = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);
    const namespace = KubernetesNamespace.getName(queue.namespaceId);

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
     * REDIS
     * =======================
     */
    await helmReleaseApiV1.delete(`${name}-redis`, namespace);

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, namespace);

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    await statefulSetApiV1.delete(name, namespace);
  },
  getName(queue: QueueDocument) {
    return `queue-${queue._id}`;
  },
  upsert: async (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);
    const namespace = KubernetesNamespace.getName(queue.namespaceId);

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
                // Block all internal traffic.
                ipBlock: {
                  cidr: '0.0.0.0/0',
                  except: ['10.0.0.0/8', '172.0.0.0/8', '192.0.0.0/8'],
                },
              },
              {
                // Allow traffic to the API.
                namespaceSelector: {
                  matchLabels: {
                    name: 'default',
                  },
                },
                podSelector: {
                  matchLabels: {
                    app: 'api',
                  },
                },
              },
              {
                // Allow traffic to the Web Socket Server.
                namespaceSelector: {
                  matchLabels: {
                    name: 'default',
                  },
                },
                podSelector: {
                  matchLabels: {
                    app: 'api',
                  },
                },
              },
              {
                // Allow traffic within Stateful Set.
                podSelector: {
                  matchLabels: {
                    'tenlastic.com/app': name,
                    'tenlastic.com/role': 'application',
                  },
                },
              },
              {
                // Allow traffic to Redis.
                podSelector: {
                  matchLabels: {
                    release: `${name}-redis`,
                  },
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
     * ========================
     * REDIS
     * ========================
     */
    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: queue.isPreemptible
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
    const password = chance.hash({ length: 128 });
    const resources = {
      limits: {
        cpu: queue.cpu.toString(),
        memory: queue.memory.toString(),
      },
      requests: {
        cpu: queue.cpu.toString(),
        memory: queue.memory.toString(),
      },
    };

    await helmReleaseApiV1.createOrReplace(namespace, {
      metadata: {
        annotations: { 'fluxcd.io/automated': 'true' },
        name: `${name}-redis`,
      },
      spec: {
        chart: {
          name: 'redis',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '12.9.0',
        },
        releaseName: `${name}-redis`,
        values: {
          cluster: { enabled: false },
          master: {
            affinity,
            image: { tag: '6.2.1' },
            persistence: { storageClass: 'standard-expandable' },
            podLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'redis',
            },
            resources,
            statefulset: {
              labels: {
                'tenlastic.com/app': name,
                'tenlastic.com/role': 'redis',
              },
            },
          },
          password,
        },
      },
    });

    /**
     * ======================
     * SECRET
     * ======================
     */
    const administrator = { roles: ['game-servers', 'queues'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
    const array = Array(queue.replicas).fill(0);
    const redis = array.map((a, i) => `${name}-redis-master-${i}.${name}-redis-headless:6379`);
    await secretApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
        name,
      },
      stringData: {
        ACCESS_TOKEN: queue.buildId ? undefined : accessToken,
        API_URL: 'http://api.default:3000',
        QUEUE_JSON: JSON.stringify(queue),
        REDIS_CONNECTION_STRING: `redis://:${password}@${redis.join(',')}`,
        WSS_URL: 'ws://wss.default:3000',
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/');
    let manifest: k8s.V1PodTemplateSpec;
    if (isDevelopment && queue.buildId) {
      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const image = `${url.host}/${queue.namespaceId}:${queue.buildId}`;

      manifest = {
        metadata: {
          annotations: { 'tenlastic.com/queueId': queue._id.toString() },
          labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity,
          automountServiceAccountToken: false,
          containers: [
            {
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image,
              name: 'main',
              resources,
            },
          ],
          enableServiceLinks: false,
          imagePullSecrets: [{ name: `${name}-image-pull-secret` }],
        },
      };
    } else if (isDevelopment && !queue.buildId) {
      manifest = {
        metadata: {
          annotations: { 'tenlastic.com/queueId': queue._id.toString() },
          labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image: `node:12`,
              name: 'main',
              resources,
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/queue/',
            },
          ],
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else if (queue.buildId) {
      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const image = `${url.host}/${queue.namespaceId}:${queue.buildId}`;

      manifest = {
        metadata: {
          annotations: { 'tenlastic.com/queueId': queue._id.toString() },
          labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity,
          automountServiceAccountToken: false,
          containers: [
            {
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image,
              name: 'main',
              resources,
            },
          ],
          enableServiceLinks: false,
          imagePullSecrets: [{ name: `${name}-image-pull-secret` }],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          annotations: { 'tenlastic.com/queueId': queue._id.toString() },
          labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/queue:${version}`,
              name: 'main',
              resources,
            },
          ],
        },
      };
    }

    await statefulSetApiV1.createOrReplace(namespace, {
      metadata: {
        labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        replicas: queue.replicas,
        selector: {
          matchLabels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
        },
        serviceName: name,
        template: manifest,
      },
    });
  },
};
