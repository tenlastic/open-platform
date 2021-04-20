import * as k8s from '@kubernetes/client-node';
import { QueueDocument, QueueEvent } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { deploymentApiV1, roleStackApiV1, secretApiV1 } from '../apis';
import { KubernetesNamespace } from '../namespace';
import { KubernetesQueue } from '../queue';

QueueEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesQueueSidecar.delete(payload.fullDocument);
  } else {
    await KubernetesQueueSidecar.upsert(payload.fullDocument);
  }
});

export const KubernetesQueueSidecar = {
  delete: async (queue: QueueDocument) => {
    const name = KubernetesQueueSidecar.getName(queue);
    const namespace = KubernetesNamespace.getName(queue.namespaceId);

    /**
     * ======================
     * RBAC
     * ======================
     */
    await roleStackApiV1.delete(name, namespace);

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, namespace);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, namespace);
  },
  getName(queue: QueueDocument) {
    return `queue-${queue._id}-sidecar`;
  },
  upsert: async (queue: QueueDocument) => {
    const queueName = KubernetesQueue.getName(queue);
    const name = KubernetesQueueSidecar.getName(queue);
    const namespace = KubernetesNamespace.getName(queue.namespaceId);

    /**
     * ======================
     * RBAC
     * ======================
     */
    await roleStackApiV1.createOrReplace(namespace, {
      metadata: { name },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });

    /**
     * ======================
     * SECRET
     * ======================
     */
    const administrator = { roles: ['queues'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
    const appSelector = `tenlastic.com/app=${queueName}`;
    await secretApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': queueName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        LOG_CONTAINER: 'main',
        LOG_ENDPOINT: `http://api.default:3000/queues/${queue._id}/logs`,
        LOG_POD_LABEL_SELECTOR: `${appSelector},tenlastic.com/role=application`,
        LOG_POD_NAMESPACE: namespace,
        QUEUE_ENDPOINT: `http://api.default:3000/queues/${queue._id}`,
        QUEUE_POD_LABEL_SELECTOR: `${appSelector},tenlastic.com/role in (application,redis)`,
        QUEUE_POD_NAMESPACE: namespace,
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
                  key: 'tenlastic.com/low-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
    };
    const livenessProbe: k8s.V1Probe = {
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            'tenlastic.com/app': queueName,
            'tenlastic.com/role': 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:12',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 120 },
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/log-sidecar/',
            },
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:12',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 120 },
              name: 'queue-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/queue-sidecar/',
            },
          ],
          serviceAccountName: name,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          labels: {
            'tenlastic.com/app': queueName,
            'tenlastic.com/role': 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/log-sidecar:${version}`,
              livenessProbe,
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/queue-sidecar:${version}`,
              livenessProbe,
              name: 'queue-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
          ],
          serviceAccountName: name,
        },
      };
    }

    await deploymentApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': queueName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            'tenlastic.com/app': queueName,
            'tenlastic.com/role': 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
};
