import {
  helmReleaseApiV1,
  networkPolicyApiV1,
  persistentVolumeClaimApiV1,
  secretApiV1,
  statefulSetApiV1,
  V1Affinity,
  V1PodTemplateSpec,
  V1Probe,
} from '@tenlastic/kubernetes';
import { Queue, QueueDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { URL } from 'url';

import { subscribe } from '../../subscribe';

const chance = new Chance();

export const KubernetesQueue = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * REDIS
     * =======================
     */
    await secretApiV1.delete(`${name}-redis`, 'dynamic');
    await helmReleaseApiV1.delete(`${name}-redis`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-redis`);

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    await statefulSetApiV1.delete(name, 'dynamic');
  },
  getLabels: (queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${queue.namespaceId}`,
      'tenlastic.com/queueId': `${queue._id}`,
    };
  },
  getName: (queue: QueueDocument) => {
    return `queue-${queue._id}`;
  },
  subscribe: () => {
    return subscribe<QueueDocument>(Queue, 'queue', async payload => {
      if (payload.operationType === 'delete') {
        console.log(`Deleting Queue: ${payload.fullDocument._id}.`);
        await KubernetesQueue.delete(payload.fullDocument);
      } else if (
        payload.operationType === 'insert' ||
        Queue.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
      ) {
        console.log(`Upserting Queue: ${payload.fullDocument._id}.`);
        await KubernetesQueue.upsert(payload.fullDocument);
      }
    });
  },
  upsert: async (queue: QueueDocument) => {
    const labels = KubernetesQueue.getLabels(queue);
    const name = KubernetesQueue.getName(queue);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        egress: [
          {
            to: [
              {
                // Allow traffic within Stateful Set.
                podSelector: {
                  matchLabels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
                },
              },
              {
                // Allow traffic to Redis.
                podSelector: {
                  matchLabels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'redis' },
                },
              },
            ],
          },
        ],
        podSelector: {
          matchLabels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
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
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'redis' },
        name: `${name}-redis`,
      },
      stringData: { password },
    });
    await helmReleaseApiV1.delete(`${name}-redis`, 'dynamic');
    await helmReleaseApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'redis' },
        name: `${name}-redis`,
      },
      spec: {
        chart: {
          name: 'redis',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '14.6.2',
        },
        releaseName: `${name}-redis`,
        values: {
          auth: {
            existingSecret: `${name}-redis`,
            existingSecretPasswordKey: 'password',
          },
          image: { tag: '6.2.4' },
          replica: {
            affinity: getAffinity(queue, 'redis'),
            persistence: { storageClass: 'standard-expandable' },
            podLabels: { ...labels, 'tenlastic.com/role': 'redis' },
            replicaCount: queue.replicas,
            resources,
            statefulset: { labels: { ...labels, 'tenlastic.com/role': 'redis' } },
          },
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
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        ACCESS_TOKEN: queue.buildId ? undefined : accessToken,
        API_URL: 'http://api.static:3000',
        QUEUE_JSON: JSON.stringify(queue),
        REDIS_SENTINEL_PASSWORD: password,
        SENTINELS: sentinels.join(','),
        WSS_URL: 'ws://wss.static:3000',
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const probe: V1Probe = {
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

    const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/projects/');
    let manifest: V1PodTemplateSpec;
    if (isDevelopment && queue.buildId) {
      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const image = `${url.host}/${queue.namespaceId}:${queue.buildId}`;

      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
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
          imagePullSecrets: [{ name: 'docker-registry' }],
        },
      };
    } else if (isDevelopment && !queue.buildId) {
      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity: getAffinity(queue, 'application'),
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image: `node:14`,
              livenessProbe: { ...probe, initialDelaySeconds: 300 },
              name: 'main',
              readinessProbe: probe,
              resources: { requests: resources.requests },
              volumeMounts: [
                {
                  mountPath: '/usr/src/projects/javascript/node_modules/',
                  name: 'node-modules',
                },
                { mountPath: '/usr/src/', name: 'source' },
              ],
              workingDir: '/usr/src/projects/javascript/nodejs/applications/queue/',
            },
          ],
          volumes: [
            { name: 'node-modules', persistentVolumeClaim: { claimName: 'node-modules' } },
            { hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'source' },
          ],
        },
      };
    } else if (queue.buildId) {
      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const image = `${url.host}/${queue.namespaceId}:${queue.buildId}`;

      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
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
          imagePullSecrets: [{ name: 'docker-registry' }],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity: getAffinity(queue, 'application'),
          containers: [
            {
              env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/queue:${version}`,
              livenessProbe: probe,
              name: 'main',
              readinessProbe: probe,
              resources,
            },
          ],
        },
      };
    }

    await statefulSetApiV1.delete(name, 'dynamic');
    await statefulSetApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        replicas: queue.replicas,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'application' } },
        serviceName: name,
        template: manifest,
      },
    });
  },
};

async function deletePvcs(labelSelector: string) {
  const response = await persistentVolumeClaimApiV1.list('dynamic', { labelSelector });
  const pvcs = response.body.items;

  const promises = pvcs.map(p => persistentVolumeClaimApiV1.delete(p.metadata.name, 'dynamic'));
  return Promise.all(promises);
}

function getAffinity(queue: QueueDocument, role: string): V1Affinity {
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
          weight: 1,
        },
      ],
    },
  };
}
