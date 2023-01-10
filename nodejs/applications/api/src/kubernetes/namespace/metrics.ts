import { V1EnvFromSource, V1EnvVar, V1Pod } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from './';

export const KubernetesNamespaceMetrics = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = getName(namespace);

    await deploymentApiV1.delete(name, 'dynamic');

    return deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        },
        template: getPodTemplate(namespace),
      },
    });
  },
};

function getName(namespace: NamespaceDocument) {
  const name = KubernetesNamespace.getName(namespace._id);
  return `${name}-metrics`;
}

function getPodTemplate(namespace: NamespaceDocument): V1Pod {
  const affinity = KubernetesNamespace.getAffinity(namespace, NamespaceStatusComponentName.Metrics);
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = getName(namespace);
  const namespaceName = KubernetesNamespace.getName(namespace._id);

  const env: V1EnvVar[] = [
    {
      name: 'API_KEY',
      valueFrom: { secretKeyRef: { key: 'NAMESPACES', name: `${namespaceName}-api-keys` } },
    },
    { name: 'ENDPOINT', value: `http://api.static:3000/namespaces/${namespace._id}` },
    { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${namespaceName}` },
  ];
  const envFrom: V1EnvFromSource[] = [
    { secretRef: { name: 'nodejs' } },
    { secretRef: { name: namespaceName } },
  ];
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env,
            envFrom,
            image: `tenlastic/node-development:latest`,
            name: 'main',
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/metrics/`,
          },
        ],
        serviceAccountName: 'metrics',
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env,
            envFrom,
            image: `tenlastic/metrics:${version}`,
            name: 'main',
            resources,
          },
        ],
        serviceAccountName: 'metrics',
      },
    };
  }
}
