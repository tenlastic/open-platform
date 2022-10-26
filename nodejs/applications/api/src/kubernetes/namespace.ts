import {
  V1Affinity,
  V1Container,
  V1EnvFromSource,
  V1EnvVar,
  V1Pod,
  V1Probe,
} from '@kubernetes/client-node';
import {
  BaseListQuery,
  deploymentApiV1,
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
import { createConnection } from '@tenlastic/mongoose-models';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { version } from '../../package.json';
import {
  Authorization,
  AuthorizationDocument,
  AuthorizationRole,
  NamespaceDocument,
} from '../mongodb';

const chance = new Chance();

export const KubernetesNamespace = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * =======================
     * MINIO
     * =======================
     */
    try {
      await minio.removeBucket(name);
    } catch (e) {
      if (e.code !== 'NoSuchBucket') {
        throw e;
      }
    }

    /**
     * =======================
     * MONGODB
     * =======================
     */
    const connection = await createConnection({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: name,
    });
    await connection.dropDatabase();

    /**
     * =======================
     * RESOURCES
     * =======================
     */
    const query: BaseListQuery = { labelSelector: `tenlastic.com/namespaceId=${namespace._id}` };
    await deploymentApiV1.deleteCollection('dynamic', query);
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
     * AUTHORIZATIONS
     * =======================
     */
    const authorizations = await Promise.all([
      upsertAuthorization('System (Builds)', namespace._id, [AuthorizationRole.BuildsReadWrite]),
      upsertAuthorization('System (Game Servers)', namespace._id, [
        AuthorizationRole.GameServersReadWrite,
      ]),
      upsertAuthorization('System (Namespaces)', namespace._id, [
        AuthorizationRole.NamespacesReadWrite,
      ]),
      upsertAuthorization('System (Queues)', namespace._id, [
        AuthorizationRole.GameServersReadWrite,
        AuthorizationRole.QueuesReadWrite,
      ]),
      upsertAuthorization('System (Workflows)', namespace._id, [
        AuthorizationRole.WorkflowsReadWrite,
      ]),
    ]);

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
                  backend: { service: { name: `${name}-api`, port: { number: 3000 } } },
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
      roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'api' },
      subjects: [{ kind: 'ServiceAccount', name: `${name}-api`, namespace: 'dynamic' }],
    });
    await serviceAccountApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'api' },
        name: `${name}-api`,
      },
    });

    /**
     * ======================
     * SECRETS
     * ======================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        MINIO_BUCKET: name,
        MONGO_DATABASE_NAME: name,
      },
    });
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name: `${name}-api-keys`,
      },
      stringData: {
        BUILDS: authorizations[0].apiKey,
        GAME_SERVERS: authorizations[1].apiKey,
        NAMESPACES: authorizations[2].apiKey,
        QUEUES: authorizations[3].apiKey,
        WORKFLOWS: authorizations[4].apiKey,
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
    await statefulSetApiV1.delete(`${name}-api`, 'dynamic');
    await statefulSetApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'api' },
        name: `${name}-api`,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'api' } },
        serviceName: `${name}-api`,
        template: getApiPodTemplate(namespace),
      },
    });

    /**
     * ======================
     * CDC
     * ======================
     */
    await statefulSetApiV1.delete(`${name}-cdc`, 'dynamic');
    await statefulSetApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'cdc' },
        name: `${name}-cdc`,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'cdc' } },
        serviceName: `${name}-cdc`,
        template: getCdcPodTemplate(namespace),
      },
    });

    /**
     * ======================
     * CONNECTOR
     * ======================
     */
    await statefulSetApiV1.delete(`${name}-connector`, 'dynamic');
    const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
    if (isDevelopment) {
      await statefulSetApiV1.create('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'connector' },
          name: `${name}-connector`,
        },
        spec: {
          replicas: 1,
          selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'connector' } },
          serviceName: `${name}-connector`,
          template: {
            metadata: {
              labels: { ...labels, 'tenlastic.com/role': 'connector' },
              name: `${name}-connector`,
            },
            spec: {
              affinity: getAffinity(namespace, 'connector'),
              containers: [
                getAggregationApiConnectorContainerTemplate(namespace),
                getApiConnectorContainerTemplate(namespace),
              ],
              volumes: [
                {
                  hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' },
                  name: 'workspace',
                },
              ],
            },
          },
        },
      });
    } else {
      await statefulSetApiV1.create('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'connector' },
          name: `${name}-connector`,
        },
        spec: {
          replicas: 1,
          selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'connector' } },
          serviceName: `${name}-connector`,
          template: {
            metadata: {
              labels: { ...labels, 'tenlastic.com/role': 'connector' },
              name: `${name}-connector`,
            },
            spec: {
              affinity: getAffinity(namespace, 'connector'),
              containers: [
                getAggregationApiConnectorContainerTemplate(namespace),
                getApiConnectorContainerTemplate(namespace),
              ],
            },
          },
        },
      });
    }

    /**
     * ======================
     * METRICS
     * ======================
     */
    await deploymentApiV1.delete(`${name}-metrics`, 'dynamic');
    await deploymentApiV1.create('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'metrics' },
        name: `${name}-metrics`,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'metrics' } },
        template: getMetricsPodTemplate(namespace),
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

function getAggregationApiConnectorContainerTemplate(namespace: NamespaceDocument): V1Container {
  const name = KubernetesNamespace.getName(namespace._id);

  const collectionNames = ['queuemembers', 'storefronts'];
  const env: V1EnvVar[] = [
    { name: 'MONGO_COLLECTION_NAMES', value: collectionNames.join(',') },
    {
      name: 'MONGO_FROM_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_FROM_DATABASE_NAME',
      valueFrom: { secretKeyRef: { key: 'MONGO_DATABASE_NAME', name } },
    },
    {
      name: 'MONGO_TO_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_TO_DATABASE_NAME',
      value: 'aggregation-api',
    },
    {
      name: 'NATS_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'NATS_CONNECTION_STRING', name: 'nodejs' } },
    },
    { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
  ];
  const resources = { requests: { cpu: '25m', memory: '75Mi' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      command: ['npm', 'run', 'start'],
      env,
      image: `tenlastic/node-development:latest`,
      name: 'aggregation-api',
      resources: { limits: { cpu: '1000m' }, requests: resources.requests },
      volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
      workingDir: `/usr/src/nodejs/applications/connector/`,
    };
  } else {
    return {
      env,
      image: `tenlastic/connector:${version}`,
      name: 'aggregation-api',
      resources,
    };
  }
}

function getApiConnectorContainerTemplate(namespace: NamespaceDocument): V1Container {
  const name = KubernetesNamespace.getName(namespace._id);

  const collectionNames = ['authorizations', 'groups', 'namespaces', 'users'];
  const env: V1EnvVar[] = [
    { name: 'MONGO_COLLECTION_NAMES', value: collectionNames.join(',') },
    {
      name: 'MONGO_FROM_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_FROM_DATABASE_NAME',
      value: 'api',
    },
    {
      name: 'MONGO_TO_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_TO_DATABASE_NAME',
      valueFrom: { secretKeyRef: { key: 'MONGO_DATABASE_NAME', name } },
    },
    {
      name: 'NATS_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'NATS_CONNECTION_STRING', name: 'nodejs' } },
    },
    { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
  ];
  const resources = { requests: { cpu: '25m', memory: '75Mi' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      command: ['npm', 'run', 'start'],
      env,
      image: `tenlastic/node-development:latest`,
      name: 'api',
      resources: { limits: { cpu: '1000m' }, requests: resources.requests },
      volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
      workingDir: `/usr/src/nodejs/applications/connector/`,
    };
  } else {
    return {
      env,
      image: `tenlastic/connector:${version}`,
      name: 'api',
      resources,
    };
  }
}

function getApiPodTemplate(namespace: NamespaceDocument): V1Pod {
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = KubernetesNamespace.getName(namespace._id);

  const envFrom: V1EnvFromSource[] = [{ secretRef: { name: 'nodejs' } }, { secretRef: { name } }];
  const livenessProbe: V1Probe = {
    failureThreshold: 3,
    httpGet: { path: `/probes/liveness`, port: 3000 as any },
    initialDelaySeconds: 10,
    periodSeconds: 10,
  };
  const readinessProbe: V1Probe = {
    failureThreshold: 1,
    httpGet: { path: `/probes/readiness`, port: 3000 as any },
    initialDelaySeconds: 5,
    periodSeconds: 5,
  };
  const resources = { requests: { cpu: '25m', memory: '75Mi' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'api' },
        name: `${name}-api`,
      },
      spec: {
        affinity: getAffinity(namespace, 'api'),
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
            envFrom,
            image: `tenlastic/node-development:latest`,
            livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
            name: 'main',
            readinessProbe,
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/namespace-api/`,
          },
        ],
        serviceAccountName: `${name}-api`,
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'api' },
        name,
      },
      spec: {
        affinity: getAffinity(namespace, 'api'),
        containers: [
          {
            env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
            envFrom,
            image: `tenlastic/namespace-api:${version}`,
            livenessProbe,
            name: 'main',
            readinessProbe,
            resources,
          },
        ],
        serviceAccountName: `${name}-api`,
      },
    };
  }
}

function getCdcPodTemplate(namespace: NamespaceDocument): V1Pod {
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = KubernetesNamespace.getName(namespace._id);

  const env: V1EnvVar[] = [
    { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
  ];
  const envFrom: V1EnvFromSource[] = [{ secretRef: { name: 'nodejs' } }, { secretRef: { name } }];
  const resources = { requests: { cpu: '25m', memory: '75Mi' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'cdc' },
        name: `${name}-cdc`,
      },
      spec: {
        affinity: getAffinity(namespace, 'cdc'),
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env,
            envFrom,
            image: `tenlastic/node-development:latest`,
            name: 'main',
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/cdc/`,
          },
        ],
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'cdc' },
        name,
      },
      spec: {
        affinity: getAffinity(namespace, 'cdc'),
        containers: [
          {
            env,
            envFrom,
            image: `tenlastic/cdc:${version}`,
            name: 'main',
            resources,
          },
        ],
      },
    };
  }
}

function getMetricsPodTemplate(namespace: NamespaceDocument): V1Pod {
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = KubernetesNamespace.getName(namespace._id);

  const env: V1EnvVar[] = [
    {
      name: 'API_KEY',
      valueFrom: { secretKeyRef: { key: 'NAMESPACES', name: `${name}-api-keys` } },
    },
    { name: 'ENDPOINT', value: `http://api.static:3000/namespaces/${namespace._id}` },
    { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${name}` },
  ];
  const envFrom: V1EnvFromSource[] = [{ secretRef: { name: 'nodejs' } }, { secretRef: { name } }];
  const resources = { requests: { cpu: '25m', memory: '75Mi' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'metrics' },
        name: `${name}-metrics`,
      },
      spec: {
        affinity: getAffinity(namespace, 'metrics'),
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env,
            envFrom,
            image: `tenlastic/node-development:latest`,
            name: 'main',
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/metrics/`,
          },
        ],
        serviceAccountName: 'metrics',
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'metrics' },
        name,
      },
      spec: {
        affinity: getAffinity(namespace, 'metrics'),
        containers: [
          {
            env,
            envFrom,
            image: `tenlastic/metrics:${version}`,
            name: 'main',
            resources,
          },
        ],
        serviceAccountName: 'metrics',
      },
    };
  }
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

async function upsertAuthorization(
  name: string,
  namespaceId: mongoose.Types.ObjectId,
  roles: AuthorizationRole[],
): Promise<AuthorizationDocument> {
  const apiKey = chance.hash({ length: 64 });

  try {
    return await Authorization.create({ apiKey, name, namespaceId, roles, system: true });
  } catch (e) {
    if (e.name !== 'DuplicateKeyError') {
      throw e;
    }

    return await Authorization.findOne({ name, namespaceId });
  }
}
