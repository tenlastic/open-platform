import { V1EnvFromSource, V1EnvVar, V1Pod } from '@kubernetes/client-node';
import { statefulSetApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from './';

export const KubernetesNamespaceCdc = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = getName(namespace);

    await statefulSetApiV1.delete(name, 'dynamic');

    return statefulSetApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
        },
        serviceName: name,
        template: getPodTemplate(namespace),
      },
    });
  },
};

function getName(namespace: NamespaceDocument) {
  const name = KubernetesNamespace.getName(namespace._id);
  return `${name}-cdc`;
}

function getPodTemplate(namespace: NamespaceDocument): V1Pod {
  const affinity = KubernetesNamespace.getAffinity(namespace, NamespaceStatusComponentName.CDC);
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = getName(namespace);
  const namespaceName = KubernetesNamespace.getName(namespace._id);

  const env: V1EnvVar[] = [
    { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
  ];
  const envFrom: V1EnvFromSource[] = [
    { secretRef: { name: 'nodejs' } },
    { secretRef: { name: namespaceName } },
  ];
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
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
            imagePullPolicy: 'IfNotPresent',
            name: 'cdc',
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/cdc/`,
          },
        ],
        volumes: [
          { hostPath: { path: '/usr/src/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env,
            envFrom,
            image: `tenlastic/cdc:${version}`,
            name: 'cdc',
            resources,
          },
        ],
      },
    };
  }
}
