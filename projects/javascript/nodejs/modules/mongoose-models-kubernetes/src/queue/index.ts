import * as k8s from '@kubernetes/client-node';
import {
  helmReleaseApiV1,
  networkPolicyApiV1,
  secretApiV1,
  statefulSetApiV1,
} from '@tenlastic/kubernetes';
import { Queue, QueueDocument, QueueEvent } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { URL } from 'url';

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
    await secretApiV1.delete(`${name}-redis`, namespace);
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
            ports: [
              // Allow DNS resolution.
              { port: 53 as any, protocol: 'TCP' },
              { port: 53 as any, protocol: 'UDP' },
            ],
            to: [
              {
                // Block internal traffic.
                ipBlock: {
                  cidr: '0.0.0.0/0',
                  except: ['10.0.0.0/8', '172.0.0.0/8', '192.0.0.0/8'],
                },
              },
              {
                // Allow traffic to the API.
                namespaceSelector: { matchLabels: { name: 'default' } },
                podSelector: { matchLabels: { app: 'api' } },
              },
              {
                // Allow traffic to the Web Socket Server.
                namespaceSelector: { matchLabels: { name: 'default' } },
                podSelector: { matchLabels: { app: 'wss' } },
              },
              {
                // Allow traffic within Stateful Set.
                podSelector: {
                  matchLabels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
                },
              },
              {
                // Allow traffic to Redis.
                podSelector: {
                  matchLabels: { 'tenlastic.com/app': name, release: `${name}-redis` },
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
    const password = chance.hash({ length: 128 });
    const resources = {
      limits: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
      requests: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
    };
    await secretApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'redis',
        },
        name: `${name}-redis`,
      },
      stringData: { password },
    });
    await helmReleaseApiV1.delete(`${name}-redis`, namespace);
    await helmReleaseApiV1.create(namespace, {
      metadata: { name: `${name}-redis` },
      spec: {
        chart: {
          name: 'redis',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '13.0.1',
        },
        releaseName: `${name}-redis`,
        values: {
          cluster: { slaveCount: queue.replicas },
          existingSecret: `${name}-redis`,
          existingSecretPasswordKey: 'password',
          image: { tag: '6.2.1' },
          sentinel: {
            downAfterMilliseconds: 10000,
            enabled: true,
            image: { tag: '6.0.12' },
            quorum: Math.floor(queue.replicas / 2 + 1),
            resources: {
              limits: { cpu: '50m', memory: '50M' },
              requests: { cpu: '50m', memory: '50M' },
            },
            staticID: true,
          },
          slave: {
            affinity: getAffinity(queue, 'redis'),
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
    const sentinels = array.map((a, i) => `${name}-redis-node-${i}.${name}-redis-headless:26379`);
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
        REDIS_SENTINEL_PASSWORD: password,
        SENTINELS: sentinels.join(','),
        WSS_URL: 'ws://wss.default:3000',
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const livenessProbe: k8s.V1Probe = {
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

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
          affinity: getAffinity(queue, 'application'),
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
          affinity: getAffinity(queue, 'application'),
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image: `node:12`,
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 120 },
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
          affinity: getAffinity(queue, 'application'),
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
          affinity: getAffinity(queue, 'application'),
          containers: [
            {
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/queue:${version}`,
              livenessProbe,
              name: 'main',
              resources,
            },
          ],
        },
      };
    }

    await statefulSetApiV1.delete(name, namespace);
    await statefulSetApiV1.create(namespace, {
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

function getAffinity(queue: QueueDocument, role: string): k8s.V1Affinity {
  const name = KubernetesQueue.getName(queue);

  return {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: queue.preemptible
                  ? 'tenlastic.com/low-priority'
                  : 'tenlastic.com/high-priority',
                operator: 'Exists',
              },
            ],
          },
        ],
      },
    },
    podAntiAffinity: {
      preferredDuringSchedulingIgnoredDuringExecution: [
        {
          podAffinityTerm: {
            labelSelector: {
              matchExpressions: [
                { key: 'tenlastic.com/app', operator: 'In', values: [name] },
                { key: 'tenlastic.com/role', operator: 'In', values: [role] },
              ],
            },
            topologyKey: 'kubernetes.io/hostname',
          },
          weight: 100,
        },
      ],
    },
  };
}
