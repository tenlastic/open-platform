import {
  V1Affinity,
  V1EnvFromSource,
  V1EnvVar,
  V1PodTemplateSpec,
  V1Probe,
} from '@kubernetes/client-node';
import { networkPolicyApiV1, secretApiV1, statefulSetApiV1 } from '@tenlastic/kubernetes';

import { QueueDocument } from '../mongodb';
import { KubernetesNamespace } from './namespace';

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
    const namespaceName = KubernetesNamespace.getName(queue.namespaceId);

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
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        API_URL: `http://${namespaceName}-api.dynamic:3000`,
        QUEUE_JSON: JSON.stringify(queue),
        WSS_URL: `ws://${namespaceName}-wss.dynamic:3000`,
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const env: V1EnvVar[] = [
      {
        name: 'API_KEY',
        valueFrom: { secretKeyRef: { key: 'QUEUES', name: `${namespaceName}-api-keys` } },
      },
      { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
    ];
    const envFrom: V1EnvFromSource[] = [
      { secretRef: { name: 'nodejs' } },
      { secretRef: { name: namespaceName } },
      { secretRef: { name } },
    ];
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: '/probes/liveness', port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };
    const readinessProbe: V1Probe = {
      failureThreshold: 1,
      httpGet: { path: '/probes/readiness', port: 3000 as any },
      initialDelaySeconds: 5,
      periodSeconds: 5,
    };
    const resources = {
      limits: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
      requests: { cpu: `${queue.cpu}`, memory: `${queue.memory}` },
    };

    const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
    let manifest: V1PodTemplateSpec;
    if (isDevelopment) {
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
              env,
              envFrom,
              image: `tenlastic/node-development:latest`,
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
              env,
              envFrom,
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
