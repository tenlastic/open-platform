import { V1EnvFromSource, V1Pod, V1Probe } from '@kubernetes/client-node';
import { serviceApiV1, statefulSetApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from './';

export const KubernetesNamespaceApi = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = getName(namespace);

    await serviceApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name,
      },
      spec: {
        ports: [{ name: 'tcp', port: 3000 }],
        selector: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
      },
    });

    await statefulSetApiV1.delete(name, 'dynamic');

    return statefulSetApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        },
        serviceName: name,
        template: getPodTemplate(namespace),
      },
    });
  },
};

function getName(namespace: NamespaceDocument) {
  const name = KubernetesNamespace.getName(namespace._id);
  return `${name}-api`;
}

function getPodTemplate(namespace: NamespaceDocument): V1Pod {
  const affinity = KubernetesNamespace.getAffinity(namespace, NamespaceStatusComponentName.API);
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = getName(namespace);
  const namespaceName = KubernetesNamespace.getName(namespace._id);

  const envFrom: V1EnvFromSource[] = [
    { secretRef: { name: 'nodejs' } },
    { secretRef: { name: namespaceName } },
  ];
  const livenessProbe: V1Probe = {
    failureThreshold: 3,
    httpGet: { path: `/probes/liveness`, port: 3000 as any },
    initialDelaySeconds: 10,
    periodSeconds: 10,
  };
  const readinessProbe: V1Probe = {
    failureThreshold: 1,
    httpGet: { path: `/probes/readiness`, port: 3000 as any },
    initialDelaySeconds: 5,
    periodSeconds: 5,
  };
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
            envFrom,
            image: `tenlastic/node-development:latest`,
            livenessProbe: { ...livenessProbe, initialDelaySeconds: 30 },
            name: 'main',
            readinessProbe,
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/namespace-api/`,
          },
        ],
        serviceAccountName: `namespace-api`,
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
            envFrom,
            image: `tenlastic/namespace-api:${version}`,
            livenessProbe,
            name: 'main',
            readinessProbe,
            resources,
          },
        ],
        serviceAccountName: `namespace-api`,
      },
    };
  }
}
