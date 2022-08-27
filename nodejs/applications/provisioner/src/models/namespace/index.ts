import {
  deploymentApiV1,
  ingressApiV1,
  networkPolicyApiV1,
  secretApiV1,
  serviceApiV1,
  statefulSetApiV1,
  V1Affinity,
  V1Probe,
} from '@tenlastic/kubernetes';
import { Authorization, AuthorizationRole, NamespaceDocument } from '@tenlastic/mongoose-models';
import * as Chance from 'chance';

const chance = new Chance();

export const KubernetesNamespace = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    await Authorization.findOneAndDelete({ name, namespaceId: namespace._id });

    /**
     * =======================
     * INGRESS
     * =======================
     */
    await ingressApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * SECRET
     * =======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * API
     * ======================
     */
    await deploymentApiV1.delete(`${name}-api`, 'dynamic');
    await serviceApiV1.delete(`${name}-api`, 'dynamic');

    /**
     * ======================
     * PROVISIONER
     * ======================
     */
    await deploymentApiV1.delete(`${name}-provisioner`, 'dynamic');

    /**
     * ======================
     * WSS
     * ======================
     */
    await serviceApiV1.delete(`${name}-wss`, 'dynamic');
    await statefulSetApiV1.delete(`${name}-wss`, 'dynamic');
  },
  getLabels: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${namespace._id}`,
    };
  },
  getName: (namespace: NamespaceDocument) => {
    return `namespace-${namespace._id}`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    const apiKey = chance.hash({ length: 64 });
    await Authorization.create({
      apiKey,
      name,
      namespaceId: namespace._id,
      roles: [AuthorizationRole.NamespacesReadWrite],
      system: true,
    });

    /**
     * ========================
     * INGRESS
     * ========================
     */
    const ingress = await ingressApiV1.read('default', 'static');
    await ingressApiV1.createOrReplace('dynamic', {
      metadata: {
        annotations: ingress.body.metadata.annotations,
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        rules: [
          {
            host: ingress.body.spec.rules.find((r) => r.host.startsWith('api')).host,
            http: {
              paths: [
                getPath(namespace, '/articles'),
                getPath(namespace, '/authorizations'),
                getPath(namespace, '/builds'),
                getPath(namespace, '/collections'),
                getPath(namespace, '/game-servers'),
                getPath(namespace, '/queues'),
                getPath(namespace, '/queue-members'),
                getPath(namespace, '/storefronts'),
                getPath(namespace, '/web-sockets'),
                getPath(namespace, '/workflows'),
              ],
            },
          },
          {
            host: ingress.body.spec.rules.find((r) => r.host.startsWith('wss')).host,
            http: {
              paths: [
                {
                  backend: { service: { name: `${name}-wss`, port: { number: 3000 } } },
                  path: `/namespaces/${namespace._id}`,
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
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        DOCKER_REGISTRY_URL: process.env.DOCKER_REGISTRY_URL,
        MINIO_BUCKET: name,
        MINIO_CONNECTION_STRING: process.env.MINIO_CONNECTION_STRING,
        MONGO_CONNECTION_STRING: process.env.MONGO_CONNECTION_STRING,
        MONGO_DATABASE_NAME: name,
        NATS_CONNECTION_STRING: process.env.NATS_CONNECTION_STRING,
      },
    });

    /**
     * ======================
     * API
     * ======================
     */
    await serviceApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'api' }, name: `${name}-api` },
      spec: {
        ports: [{ name: 'tcp', port: 3000 }],
        selector: { ...labels, 'tenlastic.com/role': 'api' },
      },
    });
    await deploymentApiV1.delete(`${name}-api`, 'dynamic');
    await deploymentApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'api' },
        name: `${name}-api`,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'api' } },
        template: getPodTemplate(namespace, 'api'),
      },
    });

    /**
     * ======================
     * PROVISIONER
     * ======================
     */
    await deploymentApiV1.delete(`${name}-provisioner`, 'dynamic');
    await deploymentApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'provisioner' },
        name: `${name}-provisioner`,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'provisioner' } },
        template: getPodTemplate(namespace, 'provisioner'),
      },
    });

    /**
     * ======================
     * WEB SOCKET SERVER
     * ======================
     */
    await serviceApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'wss' }, name: `${name}-wss` },
      spec: {
        ports: [{ name: 'tcp', port: 3000 }],
        selector: { ...labels, 'tenlastic.com/role': 'wss' },
      },
    });
    await statefulSetApiV1.delete(`${name}-wss`, 'dynamic');
    await statefulSetApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'wss' },
        name: `${name}-wss`,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'wss' } },
        serviceName: `${name}-wss`,
        template: getPodTemplate(namespace, 'wss'),
      },
    });
  },
};

function getAffinity(namespace: NamespaceDocument, role: string): V1Affinity {
  const name = KubernetesNamespace.getName(namespace);

  return {
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
    podAntiAffinity: {
      preferredDuringSchedulingIgnoredDuringExecution: [
        {
          podAffinityTerm: {
            labelSelector: {
              matchExpressions: [
                { key: 'tenlastic.com/app', operator: 'In', values: [name] },
                { key: 'tenlastic.com/role', operator: 'In', values: [role] },
              ],
            },
            topologyKey: 'kubernetes.io/hostname',
          },
          weight: 1,
        },
      ],
    },
  };
}

function getPath(namespace: NamespaceDocument, path: string) {
  const name = KubernetesNamespace.getName(namespace);
  const prefix = `/namespaces/${namespace._id}`;

  return {
    backend: { service: { name: `${name}-api`, port: { number: 3000 } } },
    path: prefix + path,
    pathType: 'Prefix',
  };
}

function getPodTemplate(namespace: NamespaceDocument, role: string) {
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = KubernetesNamespace.getName(namespace);

  const livenessProbe: V1Probe = {
    failureThreshold: 3,
    httpGet: { path: `/`, port: 3000 as any },
    initialDelaySeconds: 10,
    periodSeconds: 10,
  };
  const readinessProbe: V1Probe = {
    failureThreshold: 1,
    httpGet: { path: `/`, port: 3000 as any },
    initialDelaySeconds: 5,
    periodSeconds: 5,
  };
  const resources = { requests: { cpu: '25m', memory: '75Mi' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': role },
        name: `${name}-${role}`,
      },
      spec: {
        affinity: getAffinity(namespace, role),
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
            envFrom: [{ secretRef: { name } }],
            image: `node:14`,
            livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
            name: 'main',
            readinessProbe,
            resources: { requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: '/usr/src/nodejs/applications/api/',
          },
        ],
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    const { version } = require('../../../package.json');

    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': role },
        name,
      },
      spec: {
        affinity: getAffinity(namespace, role),
        containers: [
          {
            env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
            envFrom: [{ secretRef: { name } }],
            image: `tenlastic/api:${version}`,
            livenessProbe,
            name: 'main',
            readinessProbe,
            resources,
          },
        ],
      },
    };
  }
}
