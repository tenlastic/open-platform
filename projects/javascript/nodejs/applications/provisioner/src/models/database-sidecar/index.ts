import {
  deploymentApiV1,
  secretApiV1,
  statefulSetApiV1,
  V1Affinity,
  V1EnvVar,
  V1PodTemplateSpec,
  V1Probe,
} from '@tenlastic/kubernetes';
import { DatabaseDocument, Namespace, NamespaceRole } from '@tenlastic/mongoose-models';

import { wait } from '../../wait';
import { KubernetesDatabase } from '../database';

export const KubernetesDatabaseSidecar = {
  delete: async (database: DatabaseDocument) => {
    const name = KubernetesDatabaseSidecar.getName(database);

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName(database: DatabaseDocument) {
    return `database-${database._id}-sidecar`;
  },
  upsert: async (database: DatabaseDocument) => {
    const databaseLabels = KubernetesDatabase.getLabels(database);
    const databaseName = KubernetesDatabase.getName(database);
    const name = KubernetesDatabaseSidecar.getName(database);

    const uid = await wait(1000, 15 * 1000, async () => {
      const response = await statefulSetApiV1.read(KubernetesDatabase.getName(database), 'dynamic');
      return response.body.metadata.uid;
    });
    const ownerReferences = [
      {
        apiVersion: 'apps/v1',
        controller: true,
        kind: 'StatefulSet',
        name: databaseName,
        uid,
      },
    ];

    /**
     * ======================
     * SECRET
     * ======================
     */
    const accessToken = Namespace.getAccessToken(database.namespaceId, [
      NamespaceRole.Databases,
      NamespaceRole.Namespaces,
    ]);
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...databaseLabels, 'tenlastic.com/role': 'sidecar' },
        name,
        ownerReferences,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        API_URL: 'http://api.static:3000',
        DATABASE_ENDPOINT: `http://api.static:3000/databases/${database._id}`,
        DATABASE_JSON: JSON.stringify(database),
        DATABASE_POD_LABEL_SELECTOR: `tenlastic.com/app=${databaseName}`,
        WSS_URL: 'ws://wss.static:3000',
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
                  key: 'tenlastic.com/high-priority',
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
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/projects/')) {
      manifest = {
        metadata: {
          labels: { ...databaseLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              envFrom: [{ secretRef: { name } }],
              image: 'node:14',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'database-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [
                {
                  mountPath: '/usr/src/projects/javascript/node_modules/',
                  name: 'node-modules',
                },
                { mountPath: '/usr/src/', name: 'source' },
              ],
              workingDir: '/usr/src/projects/javascript/nodejs/applications/database-sidecar/',
            },
          ],
          serviceAccountName: 'database-sidecar',
          volumes: [
            { name: 'node-modules', persistentVolumeClaim: { claimName: 'node-modules' } },
            { hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'source' },
          ],
        },
      };
    } else {
      const { version } = require('../../../package.json');

      manifest = {
        metadata: {
          labels: { ...databaseLabels, 'tenlastic.com/role': 'sidecar' },
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
          serviceAccountName: 'database-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...databaseLabels, 'tenlastic.com/role': 'sidecar' },
        name,
        ownerReferences,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...databaseLabels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
