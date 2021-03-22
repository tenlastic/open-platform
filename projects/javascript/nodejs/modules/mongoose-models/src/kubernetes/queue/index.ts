import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { NamespaceDocument } from '../../models/namespace';
import { QueueDocument, QueueEvent } from '../../models/queue';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

QueueEvent.sync(async payload => {
  const queue = payload.fullDocument;

  if (!queue.populated('namespaceDocument')) {
    await queue.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesQueue.delete(queue.namespaceDocument, queue);
  } else if (payload.operationType === 'insert') {
    await KubernetesQueue.create(queue.namespaceDocument, queue);
  } else if (payload.operationType === 'update') {
    await KubernetesQueue.delete(queue.namespaceDocument, queue);
    await KubernetesQueue.create(queue.namespaceDocument, queue);
  }
});

export const KubernetesQueue = {
  create: async (namespace: NamespaceDocument, queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(namespace.kubernetesNamespace, {
      metadata: { name },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(namespace.kubernetesNamespace, {
      metadata: { name },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(namespace.kubernetesNamespace, {
      metadata: { name },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name,
          namespace: namespace.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const administrator = { roles: ['game-servers', 'queues'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

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
    const env = [
      { name: 'ACCESS_TOKEN', value: accessToken },
      { name: 'QUEUE_ID', value: queue._id.toString() },
      { name: 'LOG_CONTAINER', value: 'main' },
      {
        name: 'LOG_ENDPOINT',
        value: `http://api.default:3000/queues/${queue._id}/logs`,
      },
      {
        name: 'LOG_POD_LABEL_SELECTOR',
        value: `app=${name}`,
      },
      { name: 'LOG_POD_NAMESPACE', value: namespace.kubernetesNamespace },
    ];

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          annotations: {
            'tenlastic.com/queueId': queue._id.toString(),
          },
          labels: { app: name },
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
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/queue/',
            },
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/log-sidecar/',
            },
          ],
          serviceAccountName: name,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      manifest = {
        metadata: {
          annotations: {
            'tenlastic.com/queueId': queue._id.toString(),
          },
          labels: { app: name },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/queue:${version}`,
              name: 'main',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
            {
              env,
              image: `tenlastic/log-sidecar:${version}`,
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
          ],
          serviceAccountName: name,
        },
      };
    }

    await appsV1.createNamespacedDeployment(namespace.kubernetesNamespace, {
      metadata: {
        labels: { app: name },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { app: name },
        },
        template: manifest,
      },
    });
  },
  delete: async (namespace: NamespaceDocument, queue: QueueDocument) => {
    const name = KubernetesQueue.getName(queue);

    /**
     * ======================
     * RBAC
     * ======================
     */
    try {
      await rbacAuthorizationV1.deleteClusterRole(name);
      await rbacAuthorizationV1.deleteNamespacedRole(name, namespace.kubernetesNamespace);
      await coreV1.deleteNamespacedServiceAccount(name, namespace.kubernetesNamespace);
      await rbacAuthorizationV1.deleteClusterRoleBinding(name);
      await rbacAuthorizationV1.deleteNamespacedRoleBinding(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    try {
      await appsV1.deleteNamespacedDeployment(name, namespace.kubernetesNamespace);
    } catch {}
  },
  getName(queue: QueueDocument) {
    return `queue-${queue._id}`;
  },
};
