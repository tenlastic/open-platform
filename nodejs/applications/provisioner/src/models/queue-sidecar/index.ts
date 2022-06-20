import { deploymentApiV1, secretApiV1, V1PodTemplateSpec, V1Probe } from '@tenlastic/kubernetes';
import { Namespace, NamespaceRole, QueueDocument } from '@tenlastic/mongoose-models';

import { KubernetesQueue } from '../queue';

export const KubernetesQueueSidecar = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueueSidecar.getName(queue);

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName: (queue: QueueDocument) => {
    return `queue-${queue._id}-sidecar`;
  },
  upsert: async (queue: QueueDocument) => {
    const queueLabels = KubernetesQueue.getLabels(queue);
    const queueName = KubernetesQueue.getName(queue);
    const name = KubernetesQueueSidecar.getName(queue);

    /**
     * ======================
     * SECRET
     * ======================
     */
    const accessToken = Namespace.getAccessToken(queue.namespaceId, [NamespaceRole.Queues]);
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...queueLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        API_URL: 'http://api.static:3000',
        QUEUE_ENDPOINT: `http://api.static:3000/queues/${queue._id}`,
        QUEUE_JSON: JSON.stringify(queue),
        QUEUE_POD_LABEL_SELECTOR: `tenlastic.com/app=${queueName}`,
        WSS_URL: 'ws://wss.static:3000',
      },
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const affinity = {
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
    };
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...queueLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:14',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'queue-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/queue-sidecar/',
            },
          ],
          serviceAccountName: 'queue-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      const { version } = require('../../../package.json');

      manifest = {
        metadata: {
          labels: { ...queueLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/queue-sidecar:${version}`,
              livenessProbe,
              name: 'queue-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
            },
          ],
          serviceAccountName: 'queue-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...queueLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...queueLabels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
