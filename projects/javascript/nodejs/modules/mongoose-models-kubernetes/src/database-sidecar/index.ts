import * as k8s from '@kubernetes/client-node';
import { DatabaseDocument, DatabaseEvent, NamespaceDocument } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { KubernetesDatabase } from '../database';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

DatabaseEvent.sync(async payload => {
  const database = payload.fullDocument;

  if (!database.populated('namespaceDocument')) {
    await database.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesDatabaseSidecar.delete(database, database.namespaceDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesDatabaseSidecar.create(database, database.namespaceDocument);
  }
});

export const KubernetesDatabaseSidecar = {
  create: async (database: DatabaseDocument, namespace: NamespaceDocument) => {
    const databaseName = KubernetesDatabase.getName(database);
    const name = KubernetesDatabaseSidecar.getName(database);

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
     * SECRET
     * ======================
     */
    const administrator = { roles: ['databases', 'namespaces'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const roles = ['application', 'kafka', 'mongodb', 'zookeeper'];
    const appSelector = `tenlastic.com/app=${databaseName}`;
    const roleSelector = `tenlastic.com/role in (${roles.join(',')})`;
    await coreV1.createNamespacedSecret(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': databaseName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        API_URL: 'http://api.default:3000',
        DATABASE_ENDPOINT: `http://api.default:3000/databases/${database._id}`,
        DATABASE_JSON: JSON.stringify(database),
        DATABASE_POD_LABEL_SELECTOR: `${appSelector},${roleSelector}`,
        DATABASE_POD_NAMESPACE: namespace.kubernetesNamespace,
        WSS_URL: 'ws://wss.default:3000',
      },
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const affinity: k8s.V1Affinity = {
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
    const env: k8s.V1EnvVar[] = [
      {
        name: 'MONGO_CONNECTION_STRING',
        valueFrom: {
          secretKeyRef: {
            key: 'MONGO_CONNECTION_STRING',
            name: databaseName,
          },
        },
      },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            'tenlastic.com/app': databaseName,
            'tenlastic.com/role': 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              envFrom: [{ secretRef: { name } }],
              image: 'node:12',
              name: 'database-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/database-sidecar/',
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
            'tenlastic.com/app': databaseName,
            'tenlastic.com/role': 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/database-sidecar:${version}`,
              name: 'database-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
          ],
          serviceAccountName: name,
        },
      };
    }

    await appsV1.createNamespacedDeployment(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': databaseName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            'tenlastic.com/app': databaseName,
            'tenlastic.com/role': 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
  delete: async (database: DatabaseDocument, namespace: NamespaceDocument) => {
    const name = KubernetesDatabaseSidecar.getName(database);

    /**
     * ======================
     * RBAC
     * ======================
     */
    try {
      await rbacAuthorizationV1.deleteNamespacedRole(name, namespace.kubernetesNamespace);
      await coreV1.deleteNamespacedServiceAccount(name, namespace.kubernetesNamespace);
      await rbacAuthorizationV1.deleteNamespacedRoleBinding(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * =======================
     * SECRET
     * =======================
     */
    try {
      await coreV1.deleteNamespacedSecret(name, namespace.kubernetesNamespace);
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
  getName(database: DatabaseDocument) {
    return `database-${database._id}-sidecar`;
  },
};
