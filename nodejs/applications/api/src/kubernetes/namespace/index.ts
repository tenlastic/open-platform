import { V1Affinity } from '@kubernetes/client-node';
import {
  BaseListQuery,
  deploymentApiV1,
  ingressApiV1,
  jobApiV1,
  networkPolicyApiV1,
  persistentVolumeClaimApiV1,
  podApiV1,
  priorityClassApiV1,
  resourceQuotaApiV1,
  secretApiV1,
  serviceApiV1,
  statefulSetApiV1,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import * as minio from '@tenlastic/minio';
import {
  createConnection,
  NamespaceDocument,
  NamespaceStatusComponentName,
} from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';

import { KubernetesNamespaceApi } from './api';
import { KubernetesNamespaceAuthorizations } from './authorizations';
import { KubernetesNamespaceCdc } from './cdc';
import { KubernetesNamespaceConnector } from './connector';
import { KubernetesNamespaceIngress } from './ingress';
import { KubernetesNamespaceMetrics } from './metrics';
import { KubernetesNamespaceMigrations } from './migrations';
import { KubernetesNamespaceNetworkPolicy } from './network-policy';
import { KubernetesNamespacePriorityClass } from './priority-class';
import { KubernetesNamespaceResourceQuota } from './resource-quota';
import { KubernetesNamespaceSecrets } from './secrets';
import { KubernetesNamespaceSidecar } from './sidecar';

export const KubernetesNamespace = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * =======================
     * MINIO
     * =======================
     */
    try {
      await minio.removeBucket(name);
    } catch (e) {
      if (e.code !== 'NoSuchBucket') {
        throw e;
      }
    }

    /**
     * =======================
     * MONGODB
     * =======================
     */
    const connection = await createConnection({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: name,
    });
    await connection.dropDatabase();

    /**
     * =======================
     * NATS
     * =======================
     */
    await nats.deleteStream(name);

    /**
     * =======================
     * RESOURCES
     * =======================
     */
    const query: BaseListQuery = { labelSelector: `tenlastic.com/namespaceId=${namespace._id}` };
    await Promise.all([
      deploymentApiV1.deleteCollection('dynamic', query),
      ingressApiV1.deleteCollection('dynamic', query),
      jobApiV1.deleteCollection('dynamic', query),
      networkPolicyApiV1.deleteCollection('dynamic', query),
      persistentVolumeClaimApiV1.deleteCollection('dynamic', query),
      podApiV1.deleteCollection('dynamic', query),
      priorityClassApiV1.deleteCollection(query),
      resourceQuotaApiV1.deleteCollection('dynamic', query),
      secretApiV1.deleteCollection('dynamic', query),
      serviceApiV1.deleteCollection('dynamic', query),
      statefulSetApiV1.deleteCollection('dynamic', query),
      workflowApiV1.deleteCollection('dynamic', query),
    ]);
  },
  getAffinity: (namespace: NamespaceDocument, role: NamespaceStatusComponentName): V1Affinity => {
    const name = KubernetesNamespace.getName(namespace._id);

    return {
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
  },
  getLabels: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${namespace._id}`,
    };
  },
  getName: (namespaceId: mongoose.Types.ObjectId | string) => {
    return `namespace-${namespaceId}`;
  },
  isDevelopment: process.env.PWD?.includes('/usr/src/nodejs/'),
  upsert: async (namespace: NamespaceDocument) => {
    const authorizations = await KubernetesNamespaceAuthorizations.upsert(namespace);

    await Promise.all([
      KubernetesNamespaceIngress.upsert(namespace),
      KubernetesNamespaceNetworkPolicy.upsert(namespace),
      KubernetesNamespacePriorityClass.upsert(namespace),
      KubernetesNamespaceResourceQuota.upsert(namespace),
      KubernetesNamespaceSecrets.upsert(authorizations, namespace),
      KubernetesNamespaceApi.upsert(namespace),
      KubernetesNamespaceCdc.upsert(namespace),
      KubernetesNamespaceConnector.upsert(namespace),
      KubernetesNamespaceMetrics.upsert(namespace),
      KubernetesNamespaceMigrations.upsert(namespace),
      KubernetesNamespaceSidecar.upsert(namespace),
    ]);
  },
};
