import { V1EnvFromSource, V1EnvVar, V1PodTemplateSpec } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../package.json';
import { KubernetesNamespace } from './namespace';

export const KubernetesNamespaceSidecar = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespaceSidecar.getName(namespace);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName: (namespace: NamespaceDocument) => {
    return `namespace-${namespace._id}-sidecar`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespaceSidecar.getName(namespace);
    const namespaceLabels = KubernetesNamespace.getLabels(namespace);
    const namespaceName = KubernetesNamespace.getName(namespace._id);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
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

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let deploymentTemplate: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      deploymentTemplate = {
        metadata: {
          labels: {
            ...namespaceLabels,
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
      deploymentTemplate = {
        metadata: {
          labels: {
            ...namespaceLabels,
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

    await deploymentApiV1.delete(name, 'dynamic');
    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...namespaceLabels, 'tenlastic.com/role': NamespaceStatusComponentName.Sidecar },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            ...namespaceLabels,
            'tenlastic.com/role': NamespaceStatusComponentName.Sidecar,
          },
        },
        template: deploymentTemplate,
      },
    });
  },
};
