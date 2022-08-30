import { V1Affinity, V1EnvFromSource, V1Pod, V1Probe } from '@kubernetes/client-node';
import {
  BaseListQuery,
  deploymentApiV1,
  helmReleaseApiV1,
  ingressApiV1,
  networkPolicyApiV1,
  persistentVolumeClaimApiV1,
  podApiV1,
  roleBindingApiV1,
  secretApiV1,
  serviceAccountApiV1,
  serviceApiV1,
  statefulSetApiV1,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import * as minio from '@tenlastic/minio';
import {
  Authorization,
  AuthorizationRole,
  createConnection,
  NamespaceDocument,
} from '@tenlastic/mongoose-models';
import * as mongoose from 'mongoose';
import * as Chance from 'chance';

const chance = new Chance();

export const KubernetesNamespace = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    await Authorization.findOneAndDelete({ name, namespaceId: namespace._id });

    /**
     * =======================
     * MINIO
     * =======================
     */
    await minio.removeBucket(name);

    /**
     * =======================
     * MONGODB
     * =======================
     */
    await new Promise<void>((resolve, reject) => {
      const connection = createConnection({
        connectionString: process.env.MONGO_CONNECTION_STRING,
        databaseName: name,
      });
      connection.on('error', async (err) => {
        await connection.close();
        return reject(err);
      });
      connection.on('open', async function () {
        await connection.dropDatabase();
        await connection.close();
        return resolve();
      });
    });

    /**
     * =======================
     * RESOURCES
     * =======================
     */
    const query: BaseListQuery = { labelSelector: `tenlastic.com/namespaceId=${namespace._id}` };
    await deploymentApiV1.deleteCollection('dynamic', query);
    await helmReleaseApiV1.deleteCollection('dynamic', query);
    await ingressApiV1.deleteCollection('dynamic', query);
    await networkPolicyApiV1.deleteCollection('dynamic', query);
    await persistentVolumeClaimApiV1.deleteCollection('dynamic', query);
    await podApiV1.deleteCollection('dynamic', query);
    await roleBindingApiV1.deleteCollection('dynamic', query);
    await secretApiV1.deleteCollection('dynamic', query);
    await serviceApiV1.deleteCollection('dynamic', query);
    await serviceAccountApiV1.deleteCollection('dynamic', query);
    await statefulSetApiV1.deleteCollection('dynamic', query);
    await workflowApiV1.deleteCollection('dynamic', query);
  },
  getLabels: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${namespace._id}`,
    };
  },
  getName: (namespaceId: mongoose.Types.ObjectId | string) => {
    return `namespace-${namespaceId}`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    const apiKey = chance.hash({ length: 64 });
    try {
      await Authorization.create({
        apiKey,
        name,
        namespaceId: namespace._id,
        roles: [AuthorizationRole.NamespacesReadWrite],
        system: true,
      });
    } catch (e) {
      if (e.name !== 'UniqueError') {
        throw e;
      }
    }

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
     * RBAC
     * ======================
     */
    await roleBindingApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'api' },
        name: `${name}-api`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: 'api',
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${name}-api`,
          namespace: 'dynamic',
        },
      ],
    });
    await serviceAccountApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'api' },
        name: `${name}-api`,
      },
    });
    await roleBindingApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'provisioner' },
        name: `${name}-provisioner`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: 'provisioner',
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${name}-provisioner`,
          namespace: 'dynamic',
        },
      ],
    });
    await serviceAccountApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'provisioner' },
        name: `${name}-provisioner`,
      },
    });

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.createOrRead('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        MINIO_BUCKET: name,
        MONGO_DATABASE_NAME: name,
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
        template: { ...getPodTemplate(namespace, 'provisioner') },
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
  const name = KubernetesNamespace.getName(namespace._id);

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
  const name = KubernetesNamespace.getName(namespace._id);
  const prefix = `/namespaces/${namespace._id}`;

  return {
    backend: { service: { name: `${name}-api`, port: { number: 3000 } } },
    path: prefix + path,
    pathType: 'Prefix',
  };
}

function getPodTemplate(namespace: NamespaceDocument, role: string): V1Pod {
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = KubernetesNamespace.getName(namespace._id);

  const envFrom: V1EnvFromSource[] = [{ secretRef: { name: 'nodejs' } }, { secretRef: { name } }];
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
            envFrom,
            image: `node:14`,
            livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
            name: 'main',
            readinessProbe,
            resources: { requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/${role}/`,
          },
        ],
        serviceAccountName: ['api', 'provisioner'].includes(role) ? `${name}-${role}` : null,
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
            envFrom,
            image: `tenlastic/api:${version}`,
            livenessProbe,
            name: 'main',
            readinessProbe,
            resources,
          },
        ],
        serviceAccountName: ['api', 'provisioner'].includes(role) ? `${name}-${role}` : null,
      },
    };
  }
}
