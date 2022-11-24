import { V1EnvVar, V1PodTemplateSpec } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';

import { version } from '../../package.json';
import { QueueDocument, QueueStatusComponentName } from '../mongodb';
import { KubernetesNamespace } from './namespace';
import { KubernetesQueue } from './queue';

export const KubernetesQueueSidecar = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueueSidecar.getName(queue);

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
    const namespaceName = KubernetesNamespace.getName(queue.namespaceId);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const apiHost = `http://${namespaceName}-api.dynamic:3000`;
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
    const env: V1EnvVar[] = [
      {
        name: 'API_KEY',
        valueFrom: { secretKeyRef: { key: 'QUEUES', name: `${namespaceName}-api-keys` } },
      },
      { name: 'ENDPOINT', value: `${apiHost}/namespaces/${queue.namespaceId}/queues/${queue._id}` },
      { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${queueName}` },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...queueLabels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'tenlastic/node-development:latest',
              name: 'status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/status-sidecar/',
            },
          ],
          serviceAccountName: 'queue-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: { ...queueLabels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/status-sidecar:${version}`,
              name: 'status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
            },
          ],
          serviceAccountName: 'queue-sidecar',
        },
      };
    }

    await deploymentApiV1.delete(name, 'dynamic');
    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...queueLabels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...queueLabels, 'tenlastic.com/role': QueueStatusComponentName.Sidecar },
        },
        template: manifest,
      },
    });
  },
};
