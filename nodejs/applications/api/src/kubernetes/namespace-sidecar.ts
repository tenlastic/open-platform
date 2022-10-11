import { V1EnvFromSource, V1EnvVar, V1PodTemplateSpec } from '@kubernetes/client-node';
import { deploymentApiV1, secretApiV1 } from '@tenlastic/kubernetes';

import { version } from '../../package.json';
import { NamespaceDocument } from '../mongodb';
import { KubernetesNamespace } from './namespace';

export const KubernetesNamespaceSidecar = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespaceSidecar.getName(namespace);

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, 'dynamic');

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
     * SECRET
     * ======================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...namespaceLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
        ENDPOINT: `http://api.static:3000/namespaces/${namespace._id}`,
        MONGO_DATABASE_NAME: namespaceName,
        LABEL_SELECTOR: `tenlastic.com/app=${namespaceName}`,
      },
    });

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
    ];
    const envFrom: V1EnvFromSource[] = [
      { secretRef: { name: 'nodejs' } },
      { secretRef: { name: namespaceName } },
      { secretRef: { name } },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let deploymentTemplate: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      deploymentTemplate = {
        metadata: {
          labels: { ...namespaceLabels, 'tenlastic.com/role': 'sidecar' },
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
              name: 'namespace-migrations-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/namespace-migrations-sidecar/',
            },
            {
              command: ['npm', 'run', 'start'],
              env,
              envFrom,
              image: 'tenlastic/node-development:latest',
              name: 'status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
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
          labels: { ...namespaceLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              envFrom,
              image: `tenlastic/namespace-sidecar:${version}`,
              name: 'namespace-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
            },
            {
              env,
              envFrom,
              image: `tenlastic/status-sidecar:${version}`,
              name: 'status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
            },
          ],
          serviceAccountName: 'namespace-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...namespaceLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...namespaceLabels, 'tenlastic.com/role': 'sidecar' } },
        template: deploymentTemplate,
      },
    });
  },
};
