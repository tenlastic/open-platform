import {
  helmReleaseApiV1,
  persistentVolumeClaimApiV1,
  secretApiV1,
  V1ResourceRequirements,
} from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';

import { KubernetesNamespace } from './';

const chance = new Chance();

export const KubernetesNats = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNats.getName(namespace);

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
    const name = KubernetesNats.getName(namespace);
    const secret = await secretApiV1.read(name, 'dynamic');
    const password = Buffer.from(secret.body.data['password'], 'base64').toString();

    const pods = Array(namespace.resources.nats.replicas)
      .fill(0)
      .map((a, i) => `${name}-${i}.${name}:4222`);

    return `jetstream:${password}@${pods.join(',')}`;
  },
  getName: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);
    return `${name}-nats`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNats.getName(namespace);

    const { cpu, memory, preemptible, replicas, storage } = namespace.resources.nats;
    const affinity = KubernetesNamespace.getAffinity(namespace, preemptible, 'nats');
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
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'nats' }, name },
      stringData: { password: chance.hash({ length: 128 }) },
    });
    const password = Buffer.from(secret.body.data['password'], 'base64').toString();

    /**
     * ========================
     * HELM RELEASE
     * ========================
     */
    await helmReleaseApiV1.delete(name, 'dynamic');
    await deletePersistentVolumeClaims(namespace);
    await helmReleaseApiV1.create('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'nats' }, name },
      spec: {
        chart: {
          git: 'https://github.com/tenlastic/open-platform',
          path: 'kubernetes/helm/nats/',
          ref: 'master',
          skipDepUpdate: true,
        },
        releaseName: name,
        values: {
          affinity,
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
          cluster: { enabled: replicas > 1 ? true : false, replicas: replicas },
          exporter: { enabled: false },
          nats: {
            jetstream: {
              enabled: true,
              fileStorage: {
                enabled: true,
                size: getNatsUnit(storage),
                storageDirectory: '/data/',
                storageClassName: 'balanced-expandable',
              },
              memStorage: { enabled: true, size: getNatsUnit(memory) },
            },
            limits: { lameDuckDuration: '30s' },
            resources,
            terminationGracePeriodSeconds: 30,
          },
          natsbox: {
            affinity,
            resources: {
              limits: { cpu: '50m', memory: '50Mi' },
              requests: { cpu: '50m', memory: '50Mi' },
            },
          },
          statefulSetPodLabels: { ...labels, 'tenlastic.com/role': 'nats' },
        },
      },
    });
  },
};

async function deletePersistentVolumeClaims(namespace: NamespaceDocument) {
  const name = KubernetesNamespace.getName(namespace._id);

  const labelSelector = `app.kubernetes.io/instance=${name}`;
  const response = await persistentVolumeClaimApiV1.list('dynamic', { labelSelector });

  const promises = response.body.items.map((p) =>
    persistentVolumeClaimApiV1.delete(p.metadata.name, 'dynamic'),
  );

  return Promise.all(promises);
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
