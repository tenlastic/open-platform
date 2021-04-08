import * as k8s from '@kubernetes/client-node';
import { NamespaceDocument, Queue, QueueDocument, QueueEvent } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { URL } from 'url';

const chance = new Chance();

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);

QueueEvent.sync(async payload => {
  const queue = payload.fullDocument;

  if (!queue.populated('namespaceDocument')) {
    await queue.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesQueue.delete(queue.namespaceDocument, queue);
  } else if (payload.operationType === 'insert') {
    await KubernetesQueue.create(queue.namespaceDocument, queue);
  } else if (
    payload.operationType === 'update' &&
    Queue.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesQueue.delete(queue.namespaceDocument, queue);
    await KubernetesQueue.create(queue.namespaceDocument, queue);
  }
});

export const KubernetesQueue = {
  create: async (namespace: NamespaceDocument, queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

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

    await customObjects.createNamespacedCustomObject(
      'helm.fluxcd.io',
      'v1',
      namespace.kubernetesNamespace,
      'helmreleases',
      {
        apiVersion: 'helm.fluxcd.io/v1',
        kind: 'HelmRelease',
        metadata: {
          annotations: { 'fluxcd.io/automated': 'true' },
          name: `${name}-redis`,
          namespace: namespace.kubernetesNamespace,
        },
        spec: {
          chart: {
            name: 'redis',
            repository: 'https://charts.bitnami.com/bitnami',
            version: '12.9.0',
          },
          releaseName: `${name}-redis`,
          values: {
            cluster: {
              enabled: false,
            },
            master: {
              affinity,
              image: {
                tag: '6.2.1',
              },
              persistence: {
                storageClass: 'standard-expandable',
              },
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
      },
    );

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const env = [
      { name: 'API_URL', value: 'http://api.default:3000' },
      { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
      { name: 'QUEUE_JSON', value: JSON.stringify(queue) },
      {
        name: 'REDIS_CONNECTION_STRING',
        value: `redis://:${password}@${name}-redis-master-0.${name}-redis-headless:6379`,
      },
      { name: 'WSS_URL', value: 'ws://wss.default:3000' },
    ];

    // Add an access token if the Queue does not use a custom Build.
    if (!queue.buildId) {
      const administrator = { roles: ['game-servers', 'queues'], system: true };
      const accessToken = jwt.sign(
        { type: 'access', user: administrator },
        process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        { algorithm: 'RS256' },
      );

      env.push({ name: 'ACCESS_TOKEN', value: accessToken });
    }

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
          containers: [{ env, image, name: 'main', resources }],
          enableServiceLinks: false,
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
              env,
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
          containers: [{ env, image, name: 'main', resources }],
          enableServiceLinks: false,
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
          containers: [{ env, image: `tenlastic/queue:${version}`, name: 'main', resources }],
        },
      };
    }

    await appsV1.createNamespacedStatefulSet(namespace.kubernetesNamespace, {
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
  delete: async (namespace: NamespaceDocument, queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

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
     * REDIS
     * =======================
     */
    try {
      await customObjects.deleteNamespacedCustomObject(
        'helm.fluxcd.io',
        'v1',
        namespace.kubernetesNamespace,
        'helmreleases',
        `${name}-redis`,
      );
    } catch {}

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    try {
      await appsV1.deleteNamespacedStatefulSet(name, namespace.kubernetesNamespace);
    } catch {}
  },
  getName(queue: QueueDocument) {
    return `queue-${queue._id}`;
  },
};
