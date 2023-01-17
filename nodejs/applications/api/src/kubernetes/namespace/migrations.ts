import { V1EnvFromSource, V1Pod } from '@kubernetes/client-node';
import { jobApiV1, podApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceStatusComponentName } from '@tenlastic/mongoose';
import wait from '@tenlastic/wait';

import { version } from '../../../package.json';
import { KubernetesNamespace } from './';

export const KubernetesNamespaceMigrations = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = getName(namespace);

    await jobApiV1.delete(name, 'dynamic');

    // Delete all Pods associated with the Job.
    const pods = await podApiV1.list('dynamic', { labelSelector: `job-name=${name}` });
    await Promise.all(pods.body.items.map((p) => podApiV1.delete(p.metadata.name, 'dynamic')));

    // Wait for the Job to be completely deleted.
    await wait(100, 5 * 1000, async () => {
      const exists = await jobApiV1.exists(name, 'dynamic');
      return !exists;
    });

    return jobApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Migrations },
        name,
      },
      spec: {
        template: getPodTemplate(namespace),
      },
    });
  },
};

function getPodTemplate(namespace: NamespaceDocument): V1Pod {
  const affinity = KubernetesNamespace.getAffinity(
    namespace,
    NamespaceStatusComponentName.Migrations,
  );
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = getName(namespace);
  const namespaceName = KubernetesNamespace.getName(namespace._id);

  const envFrom: V1EnvFromSource[] = [
    { secretRef: { name: 'nodejs' } },
    { secretRef: { name: namespaceName } },
  ];
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Migrations },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            envFrom,
            image: `tenlastic/node-development:latest`,
            imagePullPolicy: 'IfNotPresent',
            name: 'namespace-api-migrations',
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/namespace-api-migrations/`,
          },
        ],
        restartPolicy: 'OnFailure',
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Migrations },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            envFrom,
            image: `tenlastic/namespace-api-migrations:${version}`,
            name: 'namespace-api-migrations',
            resources,
          },
        ],
        restartPolicy: 'OnFailure',
      },
    };
  }
}

function getName(namespace: NamespaceDocument) {
  const name = KubernetesNamespace.getName(namespace._id);
  return `${name}-migrations`;
}
