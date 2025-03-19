import { V1Container, V1EnvVar } from '@kubernetes/client-node';
import { statefulSetApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from './';

export const KubernetesNamespaceConnector = {
  upsert: async (namespace: NamespaceDocument) => {
    const affinity = KubernetesNamespace.getAffinity(
      namespace,
      NamespaceStatusComponentName.Connector,
    );
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = getName(namespace);

    const volumes = KubernetesNamespace.isDevelopment
      ? [{ hostPath: { path: '/usr/src/open-platform/' }, name: 'workspace' }]
      : [];

    await statefulSetApiV1.delete(name, 'dynamic');

    return statefulSetApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Connector },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            ...labels,
            'tenlastic.com/role': NamespaceStatusComponentName.Connector,
          },
        },
        serviceName: name,
        template: {
          metadata: {
            labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Connector },
            name,
          },
          spec: {
            affinity,
            containers: [
              getAggregationApiContainerTemplate(namespace),
              getApiContainerTemplate(namespace),
            ],
            volumes,
          },
        },
      },
    });
  },
};

function getAggregationApiContainerTemplate(namespace: NamespaceDocument): V1Container {
  const namespaceName = KubernetesNamespace.getName(namespace._id);

  const collectionNames = [
    'group-invitations',
    'groups',
    'match-invitations',
    'matches',
    'queue-members',
    'storefronts',
  ];
  const env: V1EnvVar[] = [
    { name: 'MONGO_COLLECTION_NAMES', value: collectionNames.join(',') },
    {
      name: 'MONGO_FROM_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_FROM_DATABASE_NAME',
      valueFrom: { secretKeyRef: { key: 'MONGO_DATABASE_NAME', name: namespaceName } },
    },
    {
      name: 'MONGO_TO_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_TO_DATABASE_NAME',
      value: 'aggregation-api',
    },
    {
      name: 'NATS_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'NATS_CONNECTION_STRING', name: 'nodejs' } },
    },
    { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
  ];
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  if (KubernetesNamespace.isDevelopment) {
    return {
      command: ['npm', 'run', 'start'],
      env,
      image: `tenlastic/node-development:latest`,
      imagePullPolicy: 'IfNotPresent',
      name: 'aggregation-api',
      resources: { limits: { cpu: '1000m' }, requests: resources.requests },
      volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
      workingDir: `/usr/src/nodejs/applications/connector/`,
    };
  } else {
    return {
      env,
      image: `tenlastic/connector:${version}`,
      name: 'aggregation-api',
      resources,
    };
  }
}

function getApiContainerTemplate(namespace: NamespaceDocument): V1Container {
  const namespaceName = KubernetesNamespace.getName(namespace._id);

  const collectionNames = ['authorizations', 'namespaces', 'users'];
  const env: V1EnvVar[] = [
    { name: 'MONGO_COLLECTION_NAMES', value: collectionNames.join(',') },
    {
      name: 'MONGO_FROM_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_FROM_DATABASE_NAME',
      value: 'api',
    },
    {
      name: 'MONGO_TO_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_TO_DATABASE_NAME',
      valueFrom: { secretKeyRef: { key: 'MONGO_DATABASE_NAME', name: namespaceName } },
    },
    {
      name: 'NATS_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'NATS_CONNECTION_STRING', name: 'nodejs' } },
    },
    { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
    {
      name: 'WHERE',
      value: JSON.stringify({
        authorizations: { namespaceId: namespace._id },
        namespaces: { _id: namespace._id },
      }),
    },
  ];
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  if (KubernetesNamespace.isDevelopment) {
    return {
      command: ['npm', 'run', 'start'],
      env,
      image: `tenlastic/node-development:latest`,
      imagePullPolicy: 'IfNotPresent',
      name: 'api',
      resources: { limits: { cpu: '1000m' }, requests: resources.requests },
      volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
      workingDir: `/usr/src/nodejs/applications/connector/`,
    };
  } else {
    return {
      env,
      image: `tenlastic/connector:${version}`,
      name: 'api',
      resources,
    };
  }
}

function getName(namespace: NamespaceDocument) {
  const name = KubernetesNamespace.getName(namespace._id);
  return `${name}-connector`;
}
