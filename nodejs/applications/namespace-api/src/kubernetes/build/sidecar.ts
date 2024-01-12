import { V1EnvVar } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { BuildDocument } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from '../namespace';
import { KubernetesBuild } from './';

export const KubernetesBuildSidecar = {
  delete: async (build: BuildDocument) => {
    const name = getName(build);

    await deploymentApiV1.delete(name, 'dynamic');
  },
  upsert: async (build: BuildDocument) => {
    const labels = KubernetesBuild.getLabels(build);
    const name = getName(build);

    await deploymentApiV1.delete(name, 'dynamic');

    return deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'Sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'Sidecar' } },
        template: getPodTemplate(build),
      },
    });
  },
};

function getName(build: BuildDocument) {
  const name = KubernetesBuild.getName(build);
  return `${name}-sidecar`;
}

function getPodTemplate(build: BuildDocument) {
  const buildName = KubernetesBuild.getName(build);
  const labels = KubernetesBuild.getLabels(build);
  const name = getName(build);
  const namespaceName = KubernetesNamespace.getName(build.namespaceId);

  const { _id, namespaceId } = build;
  const host = `${namespaceName}-api.dynamic:3000`;
  const affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          { matchExpressions: [{ key: 'tenlastic.com/low-priority', operator: 'Exists' }] },
        ],
      },
    },
  };
  const env: V1EnvVar[] = [
    {
      name: 'API_KEY',
      valueFrom: { secretKeyRef: { key: 'BUILDS', name: `${namespaceName}-api-keys` } },
    },
    { name: 'ENDPOINT', value: `http://${host}/namespaces/${namespaceId}/builds/${_id}` },
    { name: 'WORKFLOW_NAME', value: buildName },
  ];

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'Sidecar' },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env,
            image: 'tenlastic/node-development:latest',
            imagePullPolicy: 'IfNotPresent',
            name: 'workflow-status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: '/usr/src/nodejs/applications/workflow-status-sidecar/',
          },
        ],
        serviceAccountName: 'build-sidecar',
        volumes: [
          { hostPath: { path: '/usr/src/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'Sidecar' },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env,
            image: `tenlastic/workflow-status-sidecar:${version}`,
            name: 'workflow-status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
          },
        ],
        serviceAccountName: 'build-sidecar',
      },
    };
  }
}
