import {
  helmReleaseApiV1,
  persistentVolumeClaimApiV1,
  podApiV1,
  secretApiV1,
  V1ResourceRequirements,
} from '@tenlastic/kubernetes';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { NamespaceDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import { Connection } from 'mongoose';

import { KubernetesNamespace } from './';

const chance = new Chance();

export const KubernetesMongodb = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesMongodb.getName(namespace);

    /**
     * ========================
     * SECRET
     * ========================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ========================
     * HELM RELEASE
     * ========================
     */
    await helmReleaseApiV1.delete(name, 'dynamic');
    await deletePersistentVolumeClaims(namespace);
  },
  getConnectionString: async (namespace: NamespaceDocument) => {
    const name = KubernetesMongodb.getName(namespace);
    const secret = await secretApiV1.read(name, 'dynamic');
    const password = Buffer.from(secret.body.data['mongodb-root-password'], 'base64').toString();

    const pods = Array(namespace.resources.mongodb.replicas)
      .fill(0)
      .map((a, i) => `${name}-${i}.${name}-headless:27017`);

    return `mongodb://root:${password}@${pods.join(',')}/admin?replicaSet=rs0`;
  },
  getName: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);
    return `${name}-mongodb`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesMongodb.getName(namespace);

    const { cpu, memory, preemptible, replicas, storage } = namespace.resources.mongodb;
    const affinity = KubernetesNamespace.getAffinity(namespace, preemptible, 'mongodb');
    const resources: V1ResourceRequirements = {
      limits: { cpu: cpu.toString(), memory: memory.toString() },
      requests: { cpu: cpu.toString(), memory: memory.toString() },
    };

    /**
     * ========================
     * SECRET
     * ========================
     */
    const secret = await secretApiV1.createOrRead('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'mongodb' }, name },
      stringData: {
        'mongodb-replica-set-key': chance.hash({ length: 16 }),
        'mongodb-root-password': chance.hash({ length: 128 }),
      },
    });
    const password = Buffer.from(secret.body.data['mongodb-root-password'], 'base64').toString();

    /**
     * ========================
     * HELM RELEASE
     * ========================
     */
    await setPrimary(namespace, password);
    await helmReleaseApiV1.delete(name, 'dynamic');
    await updatePersistentVolumeClaims(namespace);
    await helmReleaseApiV1.create('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'mongodb' }, name },
      spec: {
        chart: {
          git: 'https://github.com/tenlastic/open-platform',
          path: 'kubernetes/helm/mongodb/',
          ref: 'master',
          skipDepUpdate: true,
        },
        releaseName: name,
        values: {
          affinity,
          arbiter: {
            affinity,
            podLabels: { ...labels, 'tenlastic.com/role': 'mongodb-arbiter' },
            resources: {
              limits: { cpu: '50m', memory: '250Mi' },
              requests: { cpu: '50m', memory: '250Mi' },
            },
          },
          architecture: 'replicaset',
          auth: { existingSecret: name },
          image: { tag: '5.0.6' },
          persistence: { size: `${storage}`, storageClass: 'balanced-expandable' },
          podLabels: { ...labels, 'tenlastic.com/role': 'mongodb' },
          replicaCount: replicas,
          resources,
        },
      },
    });
  },
};

function connect(connectionString: string) {
  return new Promise<Connection>((resolve, reject) => {
    const connection = mongooseModels.createConnection({ connectionString, databaseName: 'api' });
    connection.on('connected', () => resolve(connection));
    connection.on('error', reject);
  });
}

async function deletePersistentVolumeClaims(namespace: NamespaceDocument) {
  const name = KubernetesMongodb.getName(namespace);

  const labelSelector = `app.kubernetes.io/instance=${name}`;
  const response = await persistentVolumeClaimApiV1.list('dynamic', { labelSelector });

  const promises = response.body.items.map((p) =>
    persistentVolumeClaimApiV1.delete(p.metadata.name, 'dynamic'),
  );

  return Promise.all(promises);
}

function getMembers(namespace: NamespaceDocument, version: string) {
  const name = KubernetesMongodb.getName(namespace);

  const [major] = version.split('.').map((s) => parseInt(s, 10));
  const delayKey = major >= 5 ? 'secondaryDelaySecs' : 'slaveDelay';

  const members = Array(namespace.resources.mongodb.replicas)
    .fill(0)
    .map((a, i) => ({
      _id: i > 0 ? i + 1 : i,
      arbiterOnly: false,
      buildIndexes: true,
      [delayKey]: 0,
      hidden: false,
      host: `${name}-${i}.${name}-headless.dynamic.svc.cluster.local:27017`,
      priority: 5,
      tags: {},
      votes: 1,
    }));

  members.splice(1, 0, {
    _id: 1,
    arbiterOnly: true,
    buildIndexes: true,
    [delayKey]: 0,
    hidden: false,
    host: `${name}-arbiter-0.${name}-arbiter-headless.dynamic.svc.cluster.local:27017`,
    priority: 0,
    tags: {},
    votes: 1,
  });

  return members;
}

async function setPrimary(namespace: NamespaceDocument, password: string) {
  const app = KubernetesNamespace.getName(namespace._id);
  const name = KubernetesMongodb.getName(namespace);

  const hosts = Array(namespace.resources.mongodb.replicas)
    .fill(0)
    .map((a, i) => `${name}-${i}.${name}-headless.dynamic:27017`);
  const connectionString = `mongodb://root:${password}@${hosts.join(',')}/admin`;

  // Get MongoDB pods.
  const labelSelector = `tenlastic.com/app=${app},tenlastic.com/role=mongodb`;
  const pods = await podApiV1.list('dynamic', { labelSelector });
  const primary = pods.body.items.find((p) => p.metadata.name === `${name}-0`);

  // If the primary does not exist, do nothing.
  if (!primary) {
    return;
  }

  // Force secondaries to step down.
  await stepDown(connectionString, name, primary.metadata.name);

  // Connect to the primary.
  const connection = await connect(connectionString);

  // Wait for the first pod to become the new primary.
  let { ismaster } = await connection.db.command({ isMaster: 1 });
  while (!ismaster) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const isMaster = await connection.db.command({ isMaster: 1 });
    ismaster = isMaster.ismaster;
  }

  // Get current replica set configuration.
  const { config } = await connection.db.admin().command({ replSetGetConfig: 1 });
  const { version } = await connection.db.admin().serverInfo();

  // Update the feature compatibility version.
  const [major, minor] = version.split('.').map((s) => parseInt(s, 10));
  await connection.db.admin().command({
    setFeatureCompatibilityVersion: `${major}.${minor}`,
    writeConcern: { wtimeout: 0 },
  });

  // Update the configuration, bumping its version number
  config.members = getMembers(namespace, version);
  config.version++;

  // Force the primary to accept the changes immediately.
  const status = await connection.db.admin().serverStatus();
  console.log(`Expected Primary: ${primary.metadata.name}.`);
  console.log(`Current Host: ${status.host}.`);
  return connection.db.admin().command({ replSetReconfig: config, force: true });
}

async function stepDown(connectionString: string, name: string, primary: string) {
  const connection = await connect(connectionString);

  const replicaSetStatus = await connection.db.admin().command({ replSetGetStatus: 1 });
  const primaryStatus = replicaSetStatus.members.find((m) => m.name.includes(primary));
  console.log(primaryStatus.health);

  if (primaryStatus.health === 0) {
    await connection.close();
    await new Promise((res) => setTimeout(res, 1000));
    return stepDown(connectionString, name, primary);
  }

  const serverStatus = await connection.db.admin().serverStatus();
  console.log(`Desired Primary: ${primary} - Current Primary ${serverStatus.repl.primary}`);
  if (serverStatus.repl.primary.includes(primary)) {
    await connection.close();
    return;
  }

  const { config } = await connection.db.admin().command({ replSetGetConfig: 1 });
  config.members.find((c) => c.host.includes(primary)).priority = 100;
  config.version++;
  await connection.db.admin().command({ replSetReconfig: config, force: true });
  await connection.db.admin().command({ replSetStepDown: 60, force: true });
  await connection.close();

  await new Promise((res) => setTimeout(res, 1000));

  return stepDown(connectionString, name, primary);
}

async function updatePersistentVolumeClaims(namespace: NamespaceDocument) {
  const name = KubernetesMongodb.getName(namespace);

  const labelSelector = `app.kubernetes.io/instance=${name}`;
  const response = await persistentVolumeClaimApiV1.list('dynamic', { labelSelector });

  const { replicas, storage } = namespace.resources.mongodb;
  const array = Array(replicas)
    .fill(0)
    .map((a, i) => i);

  const promises = response.body.items.map((p) => {
    const strings = array.map((a) => a.toString());

    if (strings.includes(p.metadata.name.slice(-1))) {
      return persistentVolumeClaimApiV1.resize(p.metadata.name, 'dynamic', storage);
    } else {
      return persistentVolumeClaimApiV1.delete(p.metadata.name, 'dynamic');
    }
  });

  return Promise.all(promises);
}
