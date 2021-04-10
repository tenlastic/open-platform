import * as k8s from '@kubernetes/client-node';
import { Database, DatabaseDocument, DatabaseEvent } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as path from 'path';

import {
  helmReleaseApiV1,
  ingressApiV1,
  secretApiV1,
  serviceApiV1,
  statefulSetApiV1,
} from '../apis';
import { KubernetesNamespace } from '../namespace';

const chance = new Chance();

DatabaseEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesDatabase.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    Database.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesDatabase.upsert(payload.fullDocument);
  }
});

export const KubernetesDatabase = {
  delete: async (database: DatabaseDocument) => {
    const name = KubernetesDatabase.getName(database);
    const namespace = KubernetesNamespace.getName(database.namespaceId);

    /**
     * =======================
     * INGRESS
     * =======================
     */
    await ingressApiV1.delete(name, namespace);

    /**
     * =======================
     * KAFKA
     * =======================
     */
    await secretApiV1.delete(`${name}-kafka-jaas`, namespace);
    await helmReleaseApiV1.delete(`${name}-kafka`, namespace);

    /**
     * =======================
     * MONGODB
     * =======================
     */
    await secretApiV1.delete(`${name}-mongodb`, namespace);
    await helmReleaseApiV1.delete(`${name}-mongodb`, namespace);

    /**
     * =======================
     * ZOOKEEPER
     * =======================
     */
    await secretApiV1.delete(`${name}-zookeeper`, namespace);
    await helmReleaseApiV1.delete(`${name}-zookeeper`, namespace);

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, namespace);

    /**
     * ======================
     * SERVICE
     * ======================
     */
    await serviceApiV1.delete(name, namespace);

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    await statefulSetApiV1.delete(name, namespace);
  },
  getName(database: DatabaseDocument) {
    return `database-${database._id}`;
  },
  upsert: async (database: DatabaseDocument) => {
    const name = KubernetesDatabase.getName(database);
    const namespace = KubernetesNamespace.getName(database.namespaceId);

    const now = Date.now().toString(36);
    const password = chance.hash({ length: 128 });
    const resources: k8s.V1ResourceRequirements = {
      limits: { cpu: `${database.cpu}`, memory: `${database.memory}` },
      requests: { cpu: `${database.cpu}`, memory: `${database.memory}` },
    };

    const array = Array(database.replicas).fill(0);
    const kafkas = array.map(
      (a, i) => `${name}-kafka-${now}-${i}.${name}-kafka-${now}-headless:9092`,
    );
    const mongos = array.map((a, i) => `${name}-mongodb-${i}.${name}-mongodb-headless:27017`);
    const zookeepers = array.map(
      (a, i) => `${name}-zookeeper-${now}-${i}.${name}-zookeeper-${now}-headless:2181`,
    );

    /**
     * ========================
     * INGRESS
     * ========================
     */
    const ingress = await ingressApiV1.read('default', 'default');
    await ingressApiV1.createOrReplace(namespace, {
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
    await secretApiV1.createOrReplace(namespace, {
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
    await helmReleaseApiV1.delete(`${name}-kafka`, namespace);
    await helmReleaseApiV1.createOrReplace(namespace, {
      metadata: {
        annotations: { 'fluxcd.io/automated': 'true' },
        name: `${name}-kafka`,
      },
      spec: {
        chart: {
          name: 'kafka',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '12.16.2',
        },
        releaseName: `${name}-kafka-${now}`,
        values: {
          affinity: getAffinity(database, 'kafka'),
          auth: {
            clientProtocol: 'sasl',
            interBrokerProtocol: 'sasl',
            jaas: {
              clientUsers: 'admin',
              existingSecret: `${name}-kafka-jaas`,
              interBrokerUser: 'admin',
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
    });

    /**
     * ========================
     * MONGODB
     * ========================
     */
    const mongoSecret = await secretApiV1.createOrRead(namespace, {
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
    await helmReleaseApiV1.createOrReplace(namespace, {
      metadata: {
        annotations: { 'fluxcd.io/automated': 'true' },
        name: `${name}-mongodb`,
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
    });

    /**
     * ========================
     * ZOOKEEPER
     * ========================
     */
    await secretApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'zookeeper',
        },
        name: `${name}-zookeeper`,
      },
      stringData: {
        'client-password': `${password}`,
        'server-password': `${password}`,
      },
    });
    await helmReleaseApiV1.delete(`${name}-zookeeper`, namespace);
    await helmReleaseApiV1.createOrReplace(namespace, {
      metadata: {
        annotations: { 'fluxcd.io/automated': 'true' },
        name: `${name}-zookeeper`,
      },
      spec: {
        chart: {
          name: 'zookeeper',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '6.7.0',
        },
        releaseName: `${name}-zookeeper-${now}`,
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
    });

    /**
     * =======================
     * SECRET
     * =======================
     */
    const mongoPassword = Buffer.from(mongoSecret.body.data['mongodb-root-password'], 'base64');
    await secretApiV1.createOrReplace(namespace, {
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
        KAFKA_REPLICATION_FACTOR: `${database.replicas}`,
        MONGO_CONNECTION_STRING: `mongodb://root:${mongoPassword}@${mongos.join(',')}`,
      },
    });

    /**
     * =======================
     * SERVICE
     * =======================
     */
    await serviceApiV1.createOrReplace(namespace, {
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
    const livenessProbe: k8s.V1Probe = {
      httpGet: {
        path: `/databases/${database._id}/collections`,
        port: 3000 as any,
      },
      initialDelaySeconds: 120,
      periodSeconds: 30,
    };

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
              livenessProbe,
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
              livenessProbe,
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              resources: { requests: resources.requests },
            },
          ],
        },
      };
    }

    await statefulSetApiV1.createOrReplace(namespace, {
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
