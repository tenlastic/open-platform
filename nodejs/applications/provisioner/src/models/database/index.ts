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
import { DatabaseDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import { Connection } from 'mongoose';

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
     * MONGODB
     * =======================
     */
    await secretApiV1.delete(`${name}-mongodb`, 'dynamic');
    await helmReleaseApiV1.delete(`${name}-mongodb`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-mongodb`);

    /**
     * =======================
     * NATS
     * =======================
     */
    await helmReleaseApiV1.delete(`${name}-nats`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-nats`);

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
  upsert: async (database: DatabaseDocument) => {
    const labels = KubernetesDatabase.getLabels(database);
    const name = KubernetesDatabase.getName(database);

    const password = chance.hash({ length: 128 });
    const resources: V1ResourceRequirements = {
      limits: { cpu: `${database.cpu}`, memory: `${database.memory}` },
      requests: { cpu: `${database.cpu}`, memory: `${database.memory}` },
    };

    const array = Array(database.replicas).fill(0);
    const mongos = array.map((a, i) => `${name}-mongodb-${i}.${name}-mongodb-headless:27017`);
    const nats = array.map((a, i) => `${name}-nats-${i}.${name}-nats:4222`);

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
            host: ingress.body.spec.rules.find((r) => r.host.startsWith('api')).host,
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
        tls: ingress.body.spec.tls ? ingress.body.spec.tls.map((t) => ({ hosts: t.hosts })) : null,
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
        .map((a) => persistentVolumeClaimApiV1.resize(a, 'dynamic', database.storage));
      await Promise.all(promises);
    } catch (e) {}

    // Force first MongoDB instance to become primary.
    const mongoPassword = Buffer.from(mongoSecret.body.data['mongodb-root-password'], 'base64');
    await setMongoPrimary(database, 'dynamic', `${mongoPassword}`);

    // Delete extraneous PVCs.
    const replicas = array.map((a, i) => i);
    await deletePvcs(`app.kubernetes.io/instance=${name}-mongodb`, replicas);

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
          version: '11.1.10',
        },
        releaseName: `${name}-mongodb`,
        values: {
          affinity: getAffinity(database, 'mongodb'),
          architecture: 'replicaset',
          auth: { existingSecret: `${name}-mongodb` },
          image: {
            tag: '5.0.6',
          },
          persistence: {
            size: `${database.storage}`,
            storageClass: 'balanced-expandable',
          },
          podLabels: { ...labels, 'tenlastic.com/role': 'mongodb' },
          replicaCount: database.replicas,
          resources,
        },
      },
    });

    /**
     * ========================
     * NATS
     * ========================
     */
    await helmReleaseApiV1.delete(`${name}-nats`, 'dynamic');
    await deletePvcs(`app.kubernetes.io/instance=${name}-nats`);
    await helmReleaseApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'nats' },
        name: `${name}-nats`,
      },
      spec: {
        chart: {
          git: 'https://github.com/nats-io/k8s.git',
          path: 'helm/charts/nats',
          ref: 'd1beccca2b0b15f79c592be138b25cdc92ed7216',
        },
        releaseName: `${name}-nats`,
        values: {
          affinity: getAffinity(database, 'nats'),
          auth: {
            basic: {
              accounts: {
                jetstream: { jetstream: true, users: [{ pass: password, user: 'jetstream' }] },
                system: { users: [{ pass: password, user: 'username' }] },
              },
            },
            enabled: true,
            systemAccount: 'system',
          },
          cluster: {
            enabled: database.replicas > 1 ? true : false,
            replicas: database.replicas,
          },
          exporter: { enabled: false },
          nats: {
            jetstream: {
              enabled: true,
              fileStorage: {
                enabled: true,
                size: getNatsUnit(database.storage),
                storageDirectory: '/data/',
                storageClassName: 'balanced-expandable',
              },
              memStorage: { enabled: true, size: getNatsUnit(database.memory) },
            },
            limits: { lameDuckDuration: '30s' },
            resources,
            terminationGracePeriodSeconds: 30,
          },
          statefulSetPodLabels: { ...labels, 'tenlastic.com/role': 'nats' },
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
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
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
        MONGO_CONNECTION_STRING: `mongodb://root:${mongoPassword}@${mongos.join(',')}`,
        NATS_CONNECTION_STRING: `jetstream:${password}@${nats.join(',')}`,
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
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: {
        path: `/databases/${database._id}/collections`,
        port: 3000 as any,
      },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };
    const readinessProbe: V1Probe = {
      failureThreshold: 1,
      httpGet: {
        path: `/databases/${database._id}/collections`,
        port: 3000 as any,
      },
      initialDelaySeconds: 5,
      periodSeconds: 5,
    };

    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
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
              image: `node:14`,
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              readinessProbe,
              resources: { requests: resources.requests },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/database/',
            },
          ],
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      const { version } = require('../../../package.json');

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
              livenessProbe,
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              readinessProbe,
              resources,
            },
          ],
        },
      };
    }

    await statefulSetApiV1.delete(name, 'dynamic');
    await statefulSetApiV1.create('dynamic', {
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

async function deletePvcs(labelSelector: string, replicas?: number[]) {
  const response = await persistentVolumeClaimApiV1.list('dynamic', { labelSelector });

  const promises = response.body.items
    .filter((p) => {
      if (!replicas) {
        return true;
      }

      const strings = replicas.map((r) => `${r}`);
      return !strings.includes(p.metadata.name.substr(-1));
    })
    .map((p) => persistentVolumeClaimApiV1.delete(p.metadata.name, 'dynamic'));

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

function getNatsUnit(bytes: number) {
  if (bytes === 0) {
    return '0';
  }

  const sizes = ['', 'K', 'M', 'G', 'T'];

  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  const size = sizes[index];
  const value = bytes / Math.pow(1000, index);
  const fixed = value.toFixed();

  return `${fixed}${size}`;
}

async function setMongoPrimary(database: DatabaseDocument, namespace: string, password: string) {
  const name = KubernetesDatabase.getName(database);

  // Get MongoDB pods.
  const labelSelector = `tenlastic.com/app=${name},tenlastic.com/role=mongodb`;
  const pods = await podApiV1.list(namespace, { labelSelector });
  const primary = pods.body.items.find((p) => p.metadata.name === `${name}-mongodb-0`);
  const secondaries = pods.body.items
    .filter((i) => i.metadata.name !== `${name}-mongodb-0`)
    .map((i) => i.metadata.name)
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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const isMaster = await primaryConnection.db.command({ isMaster: 1 });
    ismaster = isMaster.ismaster;
  }

  // Get current replica set configuration.
  const { config } = await primaryConnection.db.admin().command({ replSetGetConfig: 1 });
  const { version } = await primaryConnection.db.admin().serverInfo();

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
      [version.startsWith('5') ? 'secondaryDelaySecs' : 'slaveDelay']: 0,
      tags: {},
      votes: 1,
    },
  ];
  config.version = config.version + 1;

  // Force the primary to accept the changes immediately.
  await primaryConnection.db.admin().command({ replSetReconfig: config, force: true });
}

function stepDown(name: string, namespace: string, password: string, secondaries: string[]) {
  const promises = secondaries.map(async (secondary) => {
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
