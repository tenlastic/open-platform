import { V1EnvFromSource, V1PodTemplateSpec, V1Probe } from '@kubernetes/client-node';
import { deploymentApiV1, secretApiV1 } from '@tenlastic/kubernetes';
import {
  Authorization,
  AuthorizationDocument,
  AuthorizationRole,
  NamespaceDocument,
} from '@tenlastic/mongoose-models';
import * as Chance from 'chance';

import { KubernetesNamespace } from '../namespace';

const chance = new Chance();

export const KubernetesNamespaceSidecar = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespaceSidecar.getName(namespace);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    const authorization = await Authorization.findOne({ name, namespaceId: namespace._id });
    if (authorization) {
      await authorization.remove();
    }

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
    const namespaceLabels = KubernetesNamespace.getLabels(namespace);
    const namespaceName = KubernetesNamespace.getName(namespace._id);
    const name = KubernetesNamespaceSidecar.getName(namespace);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    let authorization: AuthorizationDocument;
    try {
      authorization = await Authorization.create({
        apiKey: chance.hash({ length: 64 }),
        name,
        namespaceId: namespace._id,
        roles: [AuthorizationRole.NamespacesReadWrite],
        system: true,
      });
    } catch (e) {
      if (e.name !== 'UniqueError') {
        throw e;
      }

      authorization = await Authorization.findOne({ name, namespaceId: namespace._id });
    }

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
        API_KEY: authorization.apiKey,
        API_URL: 'http://api.static:3000',
        MONGO_DATABASE_NAME: namespaceName,
        NAMESPACE_JSON: JSON.stringify(namespace),
        NAMESPACE_POD_LABEL_SELECTOR: `tenlastic.com/app=${namespaceName}`,
        WSS_URL: 'ws://wss.static:3000',
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
    const envFrom: V1EnvFromSource[] = [
      { secretRef: { name: 'nodejs' } },
      { secretRef: { name: namespaceName } },
      { secretRef: { name } },
    ];
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...namespaceLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom,
              image: 'node:14',
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

      manifest = {
        metadata: {
          labels: { ...namespaceLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
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
        template: manifest,
      },
    });
  },
};
