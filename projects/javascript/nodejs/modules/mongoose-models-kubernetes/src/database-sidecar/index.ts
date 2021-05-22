import {
  deploymentApiV1,
  roleStackApiV1,
  secretApiV1,
  V1Affinity,
  V1EnvVar,
  V1PodTemplateSpec,
  V1Probe,
} from '@tenlastic/kubernetes';
import { DatabaseDocument, DatabaseEvent } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { KubernetesDatabase } from '../database';
import { KubernetesNamespace } from '../namespace';

DatabaseEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesDatabaseSidecar.delete(payload.fullDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesDatabaseSidecar.upsert(payload.fullDocument);
  }
});

export const KubernetesDatabaseSidecar = {
  delete: async (database: DatabaseDocument) => {
    const name = KubernetesDatabaseSidecar.getName(database);
    const namespace = KubernetesNamespace.getName(database.namespaceId);

    /**
     * ======================
     * RBAC
     * ======================
     */
    await roleStackApiV1.delete(name, namespace);

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, namespace);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, namespace);
  },
  getName(database: DatabaseDocument) {
    return `database-${database._id}-sidecar`;
  },
  upsert: async (database: DatabaseDocument) => {
    const databaseName = KubernetesDatabase.getName(database);
    const name = KubernetesDatabaseSidecar.getName(database);
    const namespace = KubernetesNamespace.getName(database.namespaceId);

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
    const administrator = { roles: ['databases', 'namespaces'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const roles = ['application', 'kafka', 'mongodb', 'zookeeper'];
    const appSelector = `tenlastic.com/app=${databaseName}`;
    const roleSelector = `tenlastic.com/role in (${roles.join(',')})`;
    await secretApiV1.createOrReplace(namespace, {
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
        DATABASE_POD_NAMESPACE: namespace,
        WSS_URL: 'ws://wss.default:3000',
      },
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const affinity: V1Affinity = {
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
    const env: V1EnvVar[] = [
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
    const livenessProbe: V1Probe = {
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
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
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 300 },
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
              livenessProbe,
              name: 'database-sidecar',
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
};
