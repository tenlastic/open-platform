import {
  ingressApiV1,
  secretApiV1,
  serviceApiV1,
  statefulSetApiV1,
  V1PodTemplateSpec,
  V1Probe,
} from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose-models';

import { KubernetesNamespace } from './';
import { KubernetesMongodb } from './mongodb';
import { KubernetesNats } from './nats';

export const KubernetesWss = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesWss.getName(namespace);

    /**
     * =======================
     * INGRESS
     * =======================
     */
    await ingressApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * SERVICE
     * ======================
     */
    await serviceApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    await statefulSetApiV1.delete(name, 'dynamic');
  },
  getName: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);
    return `${name}-wss`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const affinity = KubernetesNamespace.getAffinity(namespace, true, 'wss');
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesWss.getName(namespace);

    /**
     * ========================
     * INGRESS
     * ========================
     */
    const ingress = await ingressApiV1.read('default', 'static');
    await ingressApiV1.createOrReplace('dynamic', {
      metadata: {
        annotations: {
          ...ingress.body.metadata.annotations,
          'nginx.ingress.kubernetes.io/use-regex': 'true',
        },
        labels: { ...labels, 'tenlastic.com/role': 'wss' },
        name,
      },
      spec: {
        rules: [
          {
            host: ingress.body.spec.rules.find((r) => r.host.startsWith('wss')).host,
            http: {
              paths: [
                {
                  backend: { service: { name, port: { number: 3000 } } },
                  path: `/namespaces/${namespace._id}/.*`,
                  pathType: 'Prefix',
                },
                {
                  backend: { service: { name, port: { number: 3000 } } },
                  path: `/namespaces/${namespace._id}/.*`,
                  pathType: 'Prefix',
                },
              ],
            },
          },
        ],
        tls: ingress.body.spec.tls ? ingress.body.spec.tls.map((t) => ({ hosts: t.hosts })) : null,
      },
    });

    /**
     * =======================
     * SECRET
     * =======================
     */
    const mongodbConnectionString = await KubernetesMongodb.getConnectionString(namespace);
    const natsConnectionString = await KubernetesNats.getConnectionString(namespace);
    await secretApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'wss' }, name },
      stringData: {
        JWK_URL: 'http://wss.static:3000/public-keys/jwks',
        MONGO_CONNECTION_STRING: mongodbConnectionString,
        NATS_CONNECTION_STRING: natsConnectionString,
      },
    });

    /**
     * =======================
     * SERVICE
     * =======================
     */
    await serviceApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'wss' }, name },
      spec: {
        ports: [{ name: 'tcp', port: 3000 }],
        selector: { ...labels, 'tenlastic.com/role': 'wss' },
      },
    });

    /**
     * ======================
     * STATEFUL SET
     * ======================
     */
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: `/namespaces/${namespace._id}/collections`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };
    const readinessProbe: V1Probe = {
      failureThreshold: 1,
      httpGet: { path: `/namespaces/${namespace._id}/collections`, port: 3000 as any },
      initialDelaySeconds: 5,
      periodSeconds: 5,
    };

    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'wss' },
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
              readinessProbe,
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/wss/',
            },
          ],
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      const { version } = require('../../../package.json');

      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'wss' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/wss:${version}`,
              livenessProbe,
              name: 'main',
              ports: [{ containerPort: 3000, protocol: 'TCP' }],
              readinessProbe,
              resources: {
                limits: { cpu: '50m', memory: '100M' },
                requests: { cpu: '50m', memory: '100M' },
              },
            },
          ],
        },
      };
    }

    await statefulSetApiV1.delete(name, 'dynamic');
    await statefulSetApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'wss' },
        name,
      },
      spec: {
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'wss' } },
        serviceName: name,
        template: manifest,
      },
    });
  },
};
