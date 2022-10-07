import { V1EnvFromSource, V1EnvVar, V1PodTemplateSpec, V1Probe } from '@kubernetes/client-node';
import { deploymentApiV1, secretApiV1 } from '@tenlastic/kubernetes';

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
        API_URL: 'http://api.static:3000',
        MONGO_DATABASE_NAME: namespaceName,
        NAMESPACE_JSON: JSON.stringify(namespace),
        NAMESPACE_POD_LABEL_SELECTOR: `tenlastic.com/app=${namespaceName}`,
        WSS_URL: 'ws://api.static:3000',
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
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: '/probes/liveness', port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

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
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'namespace-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/namespace-sidecar/',
            },
          ],
          serviceAccountName: 'namespace-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      const { version } = require('../../../package.json');

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
              livenessProbe,
              name: 'namespace-sidecar',
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
