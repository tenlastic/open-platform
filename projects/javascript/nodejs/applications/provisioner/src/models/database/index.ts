import {
  helmReleaseApiV1,
  ingressApiV1,
  networkPolicyApiV1,
  persistentVolumeClaimApiV1,
  podApiV1,
  secretApiV1,
  serviceApiV1,
  statefulSetApiV1,
  V1Affinity,
  V1PodTemplateSpec,
  V1Probe,
  V1ResourceRequirements,
} from '@tenlastic/kubernetes';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { Database, DatabaseDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import * as fs from 'fs';
import { Connection } from 'mongoose';
import * as path from 'path';

import { subscribe } from '../../subscribe';

const chance = new Chance();

export const KubernetesDatabase = {
  delete: async (database: DatabaseDocument) => {
    const name = KubernetesDatabase.getName(database);

    /**
     * =======================
     * INGRESS
     * =======================
     */
    await ingressApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * KAFKA
     * =======================
     */
    await secretApiV1.delete(`${name}-kafka-jaas`, 'dynamic');
    await helmReleaseApiV1.delete(`${name}-kafka`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-kafka`);

    /**
     * =======================
     * MONGODB
     * =======================
     */
    await secretApiV1.delete(`${name}-mongodb`, 'dynamic');
    await helmReleaseApiV1.delete(`${name}-mongodb`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-mongodb`);

    /**
     * =======================
     * ZOOKEEPER
     * =======================
     */
    await secretApiV1.delete(`${name}-zookeeper`, 'dynamic');
    await helmReleaseApiV1.delete(`${name}-zookeeper`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-zookeeper`);

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * SERVICE
     * ======================
     */
    await serviceApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    await statefulSetApiV1.delete(name, 'dynamic');
  },
  getLabels: (database: DatabaseDocument) => {
    const name = KubernetesDatabase.getName(database);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${database.namespaceId}`,
    };
  },
  getName: (database: DatabaseDocument) => {
    return `database-${database._id}`;
  },
  subscribe: () => {
    return subscribe<DatabaseDocument>(Database, 'database', async payload => {
      if (payload.operationType === 'delete') {
        console.log(`Deleting Database: ${payload.fullDocument._id}.`);
        await KubernetesDatabase.delete(payload.fullDocument);
      } else if (
        payload.operationType === 'insert' ||
        Database.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
      ) {
        console.log(`Upserting Database: ${payload.fullDocument._id}.`);
        await KubernetesDatabase.upsert(payload.fullDocument);
      }
    });
  },
  upsert: async (database: DatabaseDocument) => {
    const labels = KubernetesDatabase.getLabels(database);
    const name = KubernetesDatabase.getName(database);

    const password = chance.hash({ length: 128 });
    const resources: V1ResourceRequirements = {
      limits: { cpu: `${database.cpu}`, memory: `${database.memory}` },
      requests: { cpu: `${database.cpu}`, memory: `${database.memory}` },
    };

    const array = Array(database.replicas).fill(0);
    const kafkas = array.map((a, i) => `${name}-kafka-${i}.${name}-kafka-headless:9092`);
    const mongos = array.map((a, i) => `${name}-mongodb-${i}.${name}-mongodb-headless:27017`);
    const zookeepers = array.map(
      (a, i) => `${name}-zookeeper-${i}.${name}-zookeeper-headless:2181`,
    );

    /**
     * ========================
     * INGRESS
     * ========================
     */
    const ingress = await ingressApiV1.read('default', 'static');
    await ingressApiV1.createOrReplace('dynamic', {
      metadata: {
        annotations: ingress.body.metadata.annotations,
        labels: { ...labels, 'tenlastic.com/role': 'application' },
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
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'kafka' },
        name: `${name}-kafka-jaas`,
      },
      stringData: {
        'client-passwords': password,
        'inter-broker-password': password,
        'zookeeper-password': password,
      },
    });
    await helmReleaseApiV1.delete(`${name}-kafka`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-kafka`);
    await helmReleaseApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'kafka' },
        name: `${name}-kafka`,
      },
      spec: {
        chart: {
          name: 'kafka',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '12.16.2',
        },
        releaseName: `${name}-kafka`,
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
            storageClass: 'balanced-expandable',
          },
          podLabels: { ...labels, 'tenlastic.com/role': 'kafka' },
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
    const mongoSecret = await secretApiV1.createOrRead('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'mongodb' },
        name: `${name}-mongodb`,
      },
      stringData: {
        'mongodb-replica-set-key': chance.hash({ length: 16 }),
        'mongodb-root-password': password,
      },
    });

    // Update PVC storage size.
    try {
      const promises = array
        .map((a, i) => `datadir-${name}-mongodb-${i}`)
        .map(a => persistentVolumeClaimApiV1.resize(a, 'dynamic', database.storage));
      await Promise.all(promises);
    } catch (e) {}

    // Force first MongoDB instance to become primary.
    const mongoPassword = Buffer.from(mongoSecret.body.data['mongodb-root-password'], 'base64');
    await setMongoPrimary(database, 'dynamic', `${mongoPassword}`);

    await helmReleaseApiV1.delete(`${name}-mongodb`, 'dynamic');
    await helmReleaseApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'mongodb' },
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
            storageClass: 'balanced-expandable',
          },
          podLabels: { ...labels, 'tenlastic.com/role': 'mongodb' },
          readinessProbe: { initialDelaySeconds: 120 },
          replicaCount: database.replicas,
          resources,
        },
      },
    });

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        egress: [
          {
            to: [
              {
                // Allow traffic within Stateful Set.
                podSelector: {
                  matchLabels: { 'tenlastic.com/role': 'application' },
                },
              },
              {
                // Allow traffic to Kafka.
                podSelector: {
                  matchLabels: { 'tenlastic.com/role': 'kafka' },
                },
              },
              {
                // Allow traffic to MongoDB.
                podSelector: {
                  matchLabels: { 'tenlastic.com/role': 'mongodb' },
                },
              },
              {
                // Allow traffic to Zookeeper.
                podSelector: {
                  matchLabels: { 'tenlastic.com/role': 'zookeeper' },
                },
              },
            ],
          },
        ],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ========================
     * ZOOKEEPER
     * ========================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'zookeeper' },
        name: `${name}-zookeeper`,
      },
      stringData: {
        'client-password': `${password}`,
        'server-password': `${password}`,
      },
    });
    await helmReleaseApiV1.delete(`${name}-zookeeper`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-zookeeper`);
    await helmReleaseApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'zookeeper' },
        name: `${name}-zookeeper`,
      },
      spec: {
        chart: {
          name: 'zookeeper',
          repository: 'https://charts.bitnami.com/bitnami',
          version: '6.7.0',
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
          podLabels: { ...labels, 'tenlastic.com/role': 'zookeeper' },
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
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        JWK_URL: 'http://api.static:3000/public-keys/jwks',
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
    await serviceApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        ports: [{ name: 'tcp', port: 3000 }],
        selector: { ...labels, 'tenlastic.com/role': 'application' },
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const probe: V1Probe = {
      httpGet: {
        path: `/databases/${database._id}/collections`,
        port: 3000 as any,
      },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/projects/')) {
      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity: getAffinity(database, 'application'),
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env: [
                {
                  name: 'POD_NAME',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: 'metadata.name',
                    },
                  },
                },
              ],
              envFrom: [{ secretRef: { name } }],
              image: `node:12`,
              livenessProbe: { ...probe, initialDelaySeconds: 300 },
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              readinessProbe: probe,
              resources: { requests: resources.requests },
              volumeMounts: [
                {
                  mountPath: '/usr/src/projects/javascript/node_modules/',
                  name: 'node-modules',
                },
                { mountPath: '/usr/src/', name: 'source' },
              ],
              workingDir: '/usr/src/projects/javascript/nodejs/applications/database/',
            },
          ],
          volumes: [
            { name: 'node-modules', persistentVolumeClaim: { claimName: 'node-modules' } },
            { hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'source' },
          ],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          affinity: getAffinity(database, 'application'),
          containers: [
            {
              env: [
                {
                  name: 'POD_NAME',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: 'metadata.name',
                    },
                  },
                },
              ],
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/database:${version}`,
              livenessProbe: probe,
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              readinessProbe: probe,
              resources,
            },
          ],
        },
      };
    }

    await statefulSetApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        replicas: database.replicas,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'application' } },
        serviceName: name,
        template: manifest,
      },
    });
  },
};

function connectToMongo(name: string, namespace: string, password: string, podName: string) {
  return new Promise<Connection>((resolve, reject) => {
    const hostname = `${podName}.${name}-mongodb-headless.${namespace}`;
    const connectionString = `mongodb://root:${password}@${hostname}:27017/admin`;
    const databaseName = 'database';

    const connection = mongooseModels.createConnection({ connectionString, databaseName });
    connection.on('connected', () => resolve(connection));
    connection.on('error', reject);
  });
}

async function deletePvcs(labelSelector: string) {
  const response = await persistentVolumeClaimApiV1.list('dynamic', { labelSelector });
  const pvcs = response.body.items;

  const promises = pvcs.map(p => persistentVolumeClaimApiV1.delete(p.metadata.name, 'dynamic'));
  return Promise.all(promises);
}

function getAffinity(database: DatabaseDocument, role: string): V1Affinity {
  const name = KubernetesDatabase.getName(database);

  return {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: database.preemptible
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

async function setMongoPrimary(database: DatabaseDocument, namespace: string, password: string) {
  const name = KubernetesDatabase.getName(database);

  // Get MongoDB pods.
  const labelSelector = `tenlastic.com/app=${name},tenlastic.com/role=mongodb`;
  const pods = await podApiV1.list(namespace, { labelSelector });
  const primary = pods.body.items.find(p => p.metadata.name === `${name}-mongodb-0`);
  const secondaries = pods.body.items
    .filter(i => i.metadata.name !== `${name}-mongodb-0`)
    .map(i => i.metadata.name)
    .sort();

  // If the primary does not exist, do nothing.
  if (!primary) {
    return;
  }

  // Force secondaries to step down.
  await stepDown(name, namespace, password, secondaries);

  // Connect to the primary.
  const primaryConnection = await connectToMongo(name, namespace, password, primary.metadata.name);

  // Wait for the first pod to become the new primary.
  let { ismaster } = await primaryConnection.db.command({ isMaster: 1 });
  while (!ismaster) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isMaster = await primaryConnection.db.command({ isMaster: 1 });
    ismaster = isMaster.ismaster;
  }

  // Get current replica set configuration.
  const { config } = await primaryConnection.db.admin().command({ replSetGetConfig: 1 });

  // Update the configuration, bumping its version number
  const service = `${name}-mongodb-headless`;
  config.members = [
    {
      _id: 0,
      arbiterOnly: false,
      buildIndexes: true,
      hidden: false,
      host: `${primary.metadata.name}.${service}.${namespace}.svc.cluster.local:27017`,
      priority: 5,
      slaveDelay: 0,
      tags: {},
      votes: 1,
    },
  ];
  config.version = config.version + 1;

  // Force the primary to accept the changes immediately.
  await primaryConnection.db.admin().command({ replSetReconfig: config, force: true });
}

function stepDown(name: string, namespace: string, password: string, secondaries: string[]) {
  const promises = secondaries.map(async secondary => {
    const secondaryConnection = await connectToMongo(name, namespace, password, secondary);

    const { ismaster } = await secondaryConnection.db.command({ isMaster: 1 });
    if (ismaster) {
      return secondaryConnection.db.admin().command({ replSetStepDown: 120 });
    } else {
      return secondaryConnection.db.admin().command({ replSetFreeze: 120 });
    }
  });

  return Promise.allSettled(promises);
}
