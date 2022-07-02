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

export const KubernetesMinio = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesMinio.getName(namespace);

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
    const name = KubernetesMinio.getName(namespace);
    const secret = await secretApiV1.read(name, 'dynamic');
    const password = Buffer.from(secret.body.data['secretkey'], 'base64').toString();

    return `http://admin:${password}@${name}:9000`;
  },
  getName: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);
    return `${name}-minio`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesMinio.getName(namespace);

    const { cpu, memory, preemptible, replicas, storage } = namespace.resources.minio;
    const affinity = KubernetesNamespace.getAffinity(namespace, preemptible, 'minio');
    const resources: V1ResourceRequirements = {
      limits: { cpu: cpu.toString(), memory: memory.toString() },
      requests: { cpu: cpu.toString(), memory: memory.toString() },
    };

    /**
     * ========================
     * SECRET
     * ========================
     */
    await secretApiV1.createOrRead('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'minio' }, name },
      stringData: { accesskey: 'admin', secretkey: chance.hash({ length: 128 }) },
    });

    /**
     * ========================
     * HELM RELEASE
     * ========================
     */
    await helmReleaseApiV1.delete(name, 'dynamic');
    await updatePersistentVolumeClaims(namespace);
    await helmReleaseApiV1.create('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'minio' }, name },
      spec: {
        chart: {
          git: 'https://github.com/tenlastic/open-platform',
          path: 'kubernetes/helm/minio/',
          ref: 'master',
          skipDepUpdate: true,
        },
        releaseName: name,
        values: {
          affinity,
          buckets: [
            { name: 'api', policy: 'none', purge: 'false' },
            { name: 'docker-registry', policy: 'none', purge: 'false' },
          ],
          drivesPerNode: 1,
          existingSecret: name,
          mode: 'distributed',
          persistence: { size: `${storage}`, storageClass: 'balanced-expandable' },
          podLabels: { ...labels, 'tenlastic.com/role': 'minio' },
          replicas,
          resources,
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

async function updatePersistentVolumeClaims(namespace: NamespaceDocument) {
  const name = KubernetesMinio.getName(namespace);

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
