import * as k8s from '@kubernetes/client-node';
import { DatabaseDocument, DatabaseEvent, NamespaceDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

const chance = new Chance();

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);

DatabaseEvent.sync(async payload => {
  const database = payload.fullDocument;

  if (!database.populated('namespaceDocument')) {
    await database.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesDatabase.delete(database, database.namespaceDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesDatabase.create(database, database.namespaceDocument);
  }
});

export const KubernetesDatabase = {
  create: async (database: DatabaseDocument, namespace: NamespaceDocument) => {
    const name = KubernetesDatabase.getName(database);

    const kafkas = [
      `${name}-kafka-0.${name}-kafka-headless:9092`,
      `${name}-kafka-1.${name}-kafka-headless:9092`,
      `${name}-kafka-2.${name}-kafka-headless:9092`,
    ];
    const mongos = [
      `${name}-mongodb-0.${name}-mongodb-headless:27017`,
      `${name}-mongodb-1.${name}-mongodb-headless:27017`,
      `${name}-mongodb-2.${name}-mongodb-headless:27017`,
    ];
    const password = chance.hash({ length: 128 });
    const resources: k8s.V1ResourceRequirements = {
      limits: {
        cpu: database.cpu.toString(),
        memory: database.memory.toString(),
      },
      requests: {
        cpu: database.cpu.toString(),
        memory: database.memory.toString(),
      },
    };
    const zookeepers = [
      `${name}-zookeeper-0.${name}-zookeeper-headless:2181`,
      `${name}-zookeeper-1.${name}-zookeeper-headless:2181`,
      `${name}-zookeeper-2.${name}-zookeeper-headless:2181`,
    ];

    /**
     * ========================
     * KAFKA
     * ========================
     */
    await customObjects.createNamespacedCustomObject(
      'helm.fluxcd.io',
      'v1',
      namespace.kubernetesNamespace,
      'helmreleases',
      {
        apiVersion: 'helm.fluxcd.io/v1',
        kind: 'HelmRelease',
        metadata: {
          annotations: { 'fluxcd.io/automated': 'true' },
          name: `${name}-kafka`,
          namespace: namespace.kubernetesNamespace,
        },
        spec: {
          chart: {
            name: 'kafka',
            repository: 'https://charts.bitnami.com/bitnami',
            version: '12.6.2',
          },
          releaseName: `${name}-kafka`,
          values: {
            affinity: getAffinity(database, 'kafka'),
            auth: {
              clientProtocol: 'sasl',
              interBrokerProtocol: 'sasl',
              jaas: {
                clientPasswords: password,
                clientUsers: 'admin',
                interBrokerPassword: password,
                interBrokerUser: 'admin',
                zookeeperPassword: password,
                zookeeperUser: 'admin',
              },
            },
            externalZookeeper: { servers: zookeepers.join(',') },
            image: { tag: '2.7.0' },
            livenessProbe: { initialDelaySeconds: 120 },
            persistence: {
              size: '8Gi',
              storageClass: 'standard-expandable',
            },
            podLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'kafka',
            },
            readinessProbe: { initialDelaySeconds: 120 },
            replicaCount: 3,
            resources,
            zookeeper: { enabled: false },
          },
        },
      },
    );

    /**
     * ========================
     * MONGODB
     * ========================
     */
    await customObjects.createNamespacedCustomObject(
      'helm.fluxcd.io',
      'v1',
      namespace.kubernetesNamespace,
      'helmreleases',
      {
        apiVersion: 'helm.fluxcd.io/v1',
        kind: 'HelmRelease',
        metadata: {
          annotations: { 'fluxcd.io/automated': 'true' },
          name: `${name}-mongodb`,
          namespace: namespace.kubernetesNamespace,
        },
        spec: {
          chart: {
            name: 'mongodb',
            repository: 'https://charts.bitnami.com/bitnami',
            version: '10.4.1',
          },
          releaseName: `${name}-mongodb`,
          values: {
            affinity: getAffinity(database, 'mongodb'),
            architecture: 'replicaset',
            auth: {
              replicaSetKey: chance.hash({ length: 16 }),
              rootPassword: password,
            },
            image: { tag: '4.4.3' },
            livenessProbe: { initialDelaySeconds: 120 },
            persistence: {
              size: '8Gi',
              storageClass: 'standard-expandable',
            },
            podLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'mongodb',
            },
            readinessProbe: { initialDelaySeconds: 120 },
            replicaCount: 3,
            resources,
          },
        },
      },
    );

    /**
     * ========================
     * ZOOKEEPER
     * ========================
     */
    await customObjects.createNamespacedCustomObject(
      'helm.fluxcd.io',
      'v1',
      namespace.kubernetesNamespace,
      'helmreleases',
      {
        apiVersion: 'helm.fluxcd.io/v1',
        kind: 'HelmRelease',
        metadata: {
          annotations: { 'fluxcd.io/automated': 'true' },
          name: `${name}-zookeeper`,
          namespace: namespace.kubernetesNamespace,
        },
        spec: {
          chart: {
            name: 'zookeeper',
            repository: 'https://charts.bitnami.com/bitnami',
            version: '6.3.4',
          },
          releaseName: `${name}-zookeeper`,
          values: {
            affinity: getAffinity(database, 'zookeeper'),
            allowAnonymousLogin: false,
            auth: {
              clientPassword: password,
              clientUser: 'admin',
              enabled: true,
              serverPasswords: password,
              serverUsers: 'admin',
            },
            image: { tag: '3.6.2' },
            livenessProbe: { initialDelaySeconds: 120 },
            persistence: {
              size: '8Gi',
              storageClass: 'standard-expandable',
            },
            podLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'zookeeper',
            },
            readinessProbe: { initialDelaySeconds: 120 },
            replicaCount: 3,
            resources,
          },
        },
      },
    );

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const administrator = { roles: ['databases', 'namespaces'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
    const env = [
      { name: 'ACCESS_TOKEN', value: accessToken },
      { name: 'API_URL', value: 'http://api.default:3000' },
      { name: 'DATABASE_JSON', value: JSON.stringify(database) },
      {
        name: 'KAFKA_CONNECTION_STRING',
        value: `admin:${password}@${kafkas.join(',')}`,
      },
      {
        name: 'MONGO_CONNECTION_STRING',
        value: `mongodb://root:${password}@${mongos.join(',')}`,
      },
      { name: 'WSS_URL', value: 'ws://wss.default:3000' },
    ];

    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity: getAffinity(database, 'application'),
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: `node:12`,
              name: 'main',
              resources,
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/database/',
            },
          ],
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity: getAffinity(database, 'application'),
          containers: [{ env, image: `tenlastic/database:${version}`, name: 'main', resources }],
        },
      };
    }

    await appsV1.createNamespacedStatefulSet(namespace.kubernetesNamespace, {
      metadata: {
        labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
        },
        serviceName: name,
        template: manifest,
      },
    });
  },
  delete: async (database: DatabaseDocument, namespace: NamespaceDocument) => {
    const name = KubernetesDatabase.getName(database);

    /**
     * =======================
     * KAFKA
     * =======================
     */
    try {
      await customObjects.deleteNamespacedCustomObject(
        'helm.fluxcd.io',
        'v1',
        namespace.kubernetesNamespace,
        'helmreleases',
        `${name}-kafka`,
      );
    } catch {}

    /**
     * =======================
     * MONGODB
     * =======================
     */
    try {
      await customObjects.deleteNamespacedCustomObject(
        'helm.fluxcd.io',
        'v1',
        namespace.kubernetesNamespace,
        'helmreleases',
        `${name}-mongodb`,
      );
    } catch {}

    /**
     * =======================
     * ZOOKEEPER
     * =======================
     */
    try {
      await customObjects.deleteNamespacedCustomObject(
        'helm.fluxcd.io',
        'v1',
        namespace.kubernetesNamespace,
        'helmreleases',
        `${name}-zookeeper`,
      );
    } catch {}

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    try {
      await appsV1.deleteNamespacedStatefulSet(name, namespace.kubernetesNamespace);
    } catch {}
  },
  getName(database: DatabaseDocument) {
    return `database-${database._id}`;
  },
};

function getAffinity(database: DatabaseDocument, role: string): k8s.V1Affinity {
  const name = KubernetesDatabase.getName(database);

  return {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: database.isPreemptible
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
