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
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);

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

    const array = Array(database.replicas).fill(0);
    const kafkas = array.map((a, i) => `${name}-kafka-${i}.${name}-kafka-headless:9092`);
    const mongos = array.map((a, i) => `${name}-mongodb-${i}.${name}-mongodb-headless:27017`);
    const password = chance.hash({ length: 128 });
    const resources: k8s.V1ResourceRequirements = {
      limits: { cpu: `${database.cpu}`, memory: `${database.memory}` },
      requests: { cpu: `${database.cpu}`, memory: `${database.memory}` },
    };
    const zookeepers = array.map(
      (a, i) => `${name}-zookeeper-${i}.${name}-zookeeper-headless:2181`,
    );

    /**
     * ========================
     * INGRESS
     * ========================
     */
    const ingress = await networkingV1.readNamespacedIngress('default', 'default');
    await networkingV1.createNamespacedIngress(namespace.kubernetesNamespace, {
      metadata: {
        annotations: ingress.body.metadata.annotations,
        labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        rules: [
          {
            host: ingress.body.spec.rules.find(r => r.host.startsWith('api')).host,
            http: {
              paths: [
                {
                  backend: { service: { name, port: { number: 3000 } } },
                  path: `/databases/${database._id}/collections`,
                  pathType: 'Prefix',
                },
                {
                  backend: { service: { name, port: { number: 3000 } } },
                  path: `/databases/${database._id}/web-sockets`,
                  pathType: 'Prefix',
                },
              ],
            },
          },
        ],
        tls: ingress.body.spec.tls ? ingress.body.spec.tls.map(t => ({ hosts: t.hosts })) : null,
      },
    });

    /**
     * ========================
     * KAFKA
     * ========================
     */
    await coreV1.createNamespacedSecret(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'kafka',
        },
        name: `${name}-kafka-jaas`,
      },
      stringData: {
        'client-passwords': password,
        'inter-broker-password': password,
        'zookeeper-password': password,
      },
    });
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
                existingSecret: `${name}-kafka-jaas`,
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
              size: `${database.storage}`,
              storageClass: 'standard-expandable',
            },
            podLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'kafka',
            },
            readinessProbe: { initialDelaySeconds: 120 },
            replicaCount: database.replicas,
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
    await coreV1.createNamespacedSecret(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'mongodb',
        },
        name: `${name}-mongodb`,
      },
      stringData: {
        'mongodb-replica-set-key': chance.hash({ length: 16 }),
        'mongodb-root-password': password,
      },
    });
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
            auth: { existingSecret: `${name}-mongodb` },
            image: { tag: '4.4.3' },
            livenessProbe: { initialDelaySeconds: 120 },
            persistence: {
              size: `${database.storage}`,
              storageClass: 'standard-expandable',
            },
            podLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'mongodb',
            },
            readinessProbe: { initialDelaySeconds: 120 },
            replicaCount: database.replicas,
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
    await coreV1.createNamespacedSecret(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'zookeeper',
        },
        name: `${name}-zookeeper`,
      },
      stringData: {
        'client-password': password,
        'server-password': password,
      },
    });
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
              clientUser: 'admin',
              enabled: true,
              existingSecret: `${name}-zookeeper`,
              serverUsers: 'admin',
            },
            image: { tag: '3.6.2' },
            livenessProbe: { initialDelaySeconds: 120 },
            persistence: {
              size: `${database.storage}`,
              storageClass: 'standard-expandable',
            },
            podLabels: {
              'tenlastic.com/app': name,
              'tenlastic.com/role': 'zookeeper',
            },
            readinessProbe: { initialDelaySeconds: 120 },
            replicaCount: database.replicas,
            resources,
          },
        },
      },
    );

    /**
     * =======================
     * SECRET
     * =======================
     */
    await coreV1.createNamespacedSecret(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
        name,
      },
      stringData: {
        JWK_URL: 'http://api.default:3000/public-keys/jwks',
        KAFKA_CONNECTION_STRING: `admin:${password}@${kafkas.join(',')}`,
        MONGO_CONNECTION_STRING: `mongodb://root:${password}@${mongos.join(',')}`,
      },
    });

    /**
     * =======================
     * SERVICE
     * =======================
     */
    await coreV1.createNamespacedService(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
        name,
      },
      spec: {
        ports: [{ name: 'tcp', port: 3000 }],
        selector: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
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
              envFrom: [{ secretRef: { name } }],
              image: `node:12`,
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              resources: { requests: resources.requests },
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
          containers: [
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/database:${version}`,
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              resources: { requests: resources.requests },
            },
          ],
        },
      };
    }

    await appsV1.createNamespacedStatefulSet(namespace.kubernetesNamespace, {
      metadata: {
        labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        replicas: database.replicas,
        selector: {
          matchLabels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'application' },
        },
        serviceName: name,
        template: manifest,
      },
    });
  },
  delete: async (database: DatabaseDocument, namespace: NamespaceDocument) => {
    const array = Array(database.replicas).fill(0);
    const name = KubernetesDatabase.getName(database);

    /**
     * =======================
     * INGRESS
     * =======================
     */
    try {
      await networkingV1.deleteNamespacedIngress(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * =======================
     * KAFKA
     * =======================
     */
    try {
      await coreV1.deleteNamespacedSecret(`${name}-kafka-jaas`, namespace.kubernetesNamespace);
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
      await coreV1.deleteNamespacedSecret(`${name}-mongodb`, namespace.kubernetesNamespace);
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
      await coreV1.deleteNamespacedSecret(`${name}-zookeeper`, namespace.kubernetesNamespace);
      await customObjects.deleteNamespacedCustomObject(
        'helm.fluxcd.io',
        'v1',
        namespace.kubernetesNamespace,
        'helmreleases',
        `${name}-zookeeper`,
      );
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
     * SERVICE
     * ======================
     */
    try {
      await coreV1.deleteNamespacedService(name, namespace.kubernetesNamespace);
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
