import { V1EnvFromSource, V1EnvVar } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from './';

export const KubernetesNamespaceSidecar = {
  upsert: async (namespace: NamespaceDocument) => {
    const name = getName(namespace);
    const labels = KubernetesNamespace.getLabels(namespace);

    await deploymentApiV1.delete(name, 'dynamic');

    return deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Sidecar },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            ...labels,
            'tenlastic.com/role': NamespaceStatusComponentName.Sidecar,
          },
        },
        template: getPodTemplate(namespace),
      },
    });
  },
};

function getName(namespace: NamespaceDocument) {
  const name = KubernetesNamespace.getName(namespace._id);
  return `${name}-sidecar`;
}

function getPodTemplate(namespace: NamespaceDocument) {
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = getName(namespace);
  const namespaceName = KubernetesNamespace.getName(namespace._id);

  const affinity = {
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
  };
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

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: {
          ...labels,
          'tenlastic.com/role': NamespaceStatusComponentName.Sidecar,
        },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env,
            envFrom,
            image: 'tenlastic/node-development:latest',
            name: 'status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: '/usr/src/nodejs/applications/status-sidecar/',
          },
        ],
        serviceAccountName: 'namespace-sidecar',
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: {
          ...labels,
          'tenlastic.com/role': NamespaceStatusComponentName.Sidecar,
        },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env,
            envFrom,
            image: `tenlastic/status-sidecar:${version}`,
            name: 'status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
          },
        ],
        serviceAccountName: 'namespace-sidecar',
      },
    };
  }
}
