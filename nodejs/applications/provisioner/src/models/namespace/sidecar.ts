import {
  deploymentApiV1,
  ingressApiV1,
  secretApiV1,
  serviceApiV1,
  V1PodTemplateSpec,
  V1Probe,
} from '@tenlastic/kubernetes';
import { Namespace, NamespaceDocument, NamespaceRole } from '@tenlastic/mongoose-models';

import { KubernetesNamespace } from './';
import { KubernetesMongodb } from './mongodb';
import { KubernetesNats } from './nats';

export const KubernetesSidecar = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesSidecar.getName(namespace);

    /**
     * =======================
     * SECRET
     * =======================
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
    const name = KubernetesNamespace.getName(namespace._id);
    return `${name}-sidecar`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const affinity = KubernetesNamespace.getAffinity(namespace, true, 'sidecar');
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesSidecar.getName(namespace);
    const namespaceName = KubernetesNamespace.getName(namespace._id);

    /**
     * =======================
     * SECRET
     * =======================
     */
    const mongodbConnectionString = await KubernetesMongodb.getConnectionString(namespace);
    const natsConnectionString = await KubernetesNats.getConnectionString(namespace);
    await secretApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'sidecar' }, name },
      stringData: {
        DOCKER_REGISTRY_URL: 'http://',
        JWK_URL: 'http://sidecar.static:3000/public-keys/jwks',
        MINIO_BUCKET: 'sidecar',
        MINIO_CONNECTION_STRING: 'http://',
        MONGO_CONNECTION_STRING: mongodbConnectionString,
        NATS_CONNECTION_STRING: natsConnectionString,
      },
    });
    /**
     * ======================
     * SECRET
     * ======================
     */
    const accessToken = Namespace.getAccessToken(namespace._id, [NamespaceRole.Namespaces]);
    const labelSelectors = [
      `tenlastic.com/app=${namespaceName}`,
      'tenlastic.com/role!=mongodb-arbiter',
    ];
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        API_URL: 'http://api.static:3000',
        NAMESPACE_ENDPOINT: `http://api.static:3000/namespaces/${namespace._id}`,
        NAMESPACE_ID: JSON.stringify(namespace._id),
        NAMESPACE_POD_LABEL_SELECTOR: labelSelectors.join(','),
        WSS_URL: 'ws://wss.static:3000',
      },
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: `node:14`,
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
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
          labels: { ...labels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/namespace-sidecar:${version}`,
              livenessProbe,
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              resources: {
                limits: { cpu: '50m', memory: '100M' },
                requests: { cpu: '50m', memory: '100M' },
              },
            },
          ],
          serviceAccountName: 'namespace-sidecar',
        },
      };
    }

    await deploymentApiV1.delete(name, 'dynamic');
    await deploymentApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      spec: {
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
