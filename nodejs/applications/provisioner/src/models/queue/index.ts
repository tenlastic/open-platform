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
import { Namespace, NamespaceRole, QueueDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import { URL } from 'url';

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
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ========================
     * REDIS
     * ========================
     */
    const resources = {
      limits: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
      requests: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
    };

    const redisSecret = await secretApiV1.createOrRead('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'redis' },
        name: `${name}-redis`,
      },
      stringData: { password: chance.hash({ length: 128 }) },
    });
    const redisPassword = Buffer.from(redisSecret.body.data.password, 'base64');

    await helmReleaseApiV1.delete(`${name}-redis`, 'dynamic');
    await helmReleaseApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'redis' },
        name: `${name}-redis`,
      },
      spec: {
        chart: {
          git: 'https://github.com/tenlastic/open-platform',
          path: 'kubernetes/helm/redis/',
          ref: 'master',
          skipDepUpdate: true,
        },
        releaseName: `${name}-redis`,
        values: {
          auth: {
            existingSecret: `${name}-redis`,
            existingSecretPasswordKey: 'password',
          },
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
    const accessToken = Namespace.getAccessToken(queue.namespaceId, [
      NamespaceRole.GameServers,
      NamespaceRole.Queues,
    ]);
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
        REDIS_SENTINEL_PASSWORD: `${redisPassword}`,
        SENTINELS: sentinels.join(','),
        WSS_URL: 'ws://wss.static:3000',
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };
    const readinessProbe: V1Probe = {
      failureThreshold: 1,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 5,
      periodSeconds: 5,
    };

    const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
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
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'main',
              readinessProbe,
              resources: { requests: resources.requests },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/queue/',
            },
          ],
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
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
      const { version } = require('../../../package.json');

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
              livenessProbe,
              name: 'main',
              readinessProbe,
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

  const promises = pvcs.map((p) => persistentVolumeClaimApiV1.delete(p.metadata.name, 'dynamic'));
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