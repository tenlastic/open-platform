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
  jobApiV1,
  networkPolicyApiV1,
  persistentVolumeClaimApiV1,
  podApiV1,
  priorityClassApiV1,
  resourceQuotaApiV1,
  secretApiV1,
  serviceApiV1,
  statefulSetApiV1,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import * as minio from '@tenlastic/minio';
import {
  AuthorizationModel,
  AuthorizationDocument,
  AuthorizationRole,
  createConnection,
  NamespaceDocument,
  NamespaceStatusComponentName,
} from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { version } from '../../package.json';

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
     * NATS
     * =======================
     */
    await nats.deleteStream(name);

    /**
     * =======================
     * RESOURCES
     * =======================
     */
    const query: BaseListQuery = { labelSelector: `tenlastic.com/namespaceId=${namespace._id}` };
    await deploymentApiV1.deleteCollection('dynamic', query);
    await ingressApiV1.deleteCollection('dynamic', query);
    await jobApiV1.deleteCollection('dynamic', query);
    await networkPolicyApiV1.deleteCollection('dynamic', query);
    await persistentVolumeClaimApiV1.deleteCollection('dynamic', query);
    await podApiV1.deleteCollection('dynamic', query);
    await priorityClassApiV1.deleteCollection(query);
    await resourceQuotaApiV1.deleteCollection('dynamic', query);
    await secretApiV1.deleteCollection('dynamic', query);
    await serviceApiV1.deleteCollection('dynamic', query);
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
      upsertAuthorization('System (Builds)', namespace._id, [
        AuthorizationRole.BuildsRead,
        AuthorizationRole.BuildsWrite,
      ]),
      upsertAuthorization('System (Game Servers)', namespace._id, [
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersWrite,
      ]),
      upsertAuthorization('System (Namespaces)', namespace._id, [
        AuthorizationRole.NamespacesRead,
        AuthorizationRole.NamespacesWrite,
      ]),
      upsertAuthorization('System (Queues)', namespace._id, [
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersWrite,
        AuthorizationRole.MatchesRead,
        AuthorizationRole.MatchesWrite,
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesWrite,
      ]),
      upsertAuthorization('System (Workflows)', namespace._id, [
        AuthorizationRole.WorkflowsRead,
        AuthorizationRole.WorkflowsWrite,
      ]),
    ]);

    /**
     * ========================
     * INGRESS
     * ========================
     */
    const ingress = await ingressApiV1.read('default', 'static');
    await ingressApiV1.createOrReplace('dynamic', {
      metadata: { annotations: ingress.body.metadata.annotations, labels: { ...labels }, name },
      spec: {
        rules: [
          {
            host: ingress.body.spec.rules.find((r) => r.host.startsWith('api')).host,
            http: {
              paths: [
                getPath(namespace, '/articles'),
                getPath(namespace, '/builds'),
                getPath(namespace, '/collections'),
                getPath(namespace, '/game-server-templates'),
                getPath(namespace, '/game-servers'),
                getPath(namespace, '/match-invitations'),
                getPath(namespace, '/matches'),
                getPath(namespace, '/queue-members'),
                getPath(namespace, '/queues'),
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
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [
          {
            to: [
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'mongodb' } },
              },
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'nats' } },
              },
              {
                namespaceSelector: { matchLabels: { name: 'static' } },
                podSelector: { matchLabels: { 'app.kubernetes.io/name': 'redis' } },
              },
              { podSelector: { matchLabels: { 'tenlastic.com/app': name } } },
            ],
          },
        ],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ======================
     * PRIORITY CLASSES
     * ======================
     */
    await priorityClassApiV1.delete(name);
    await priorityClassApiV1.create({
      metadata: { labels: { ...labels }, name },
      value: 0,
    });

    /**
     * ======================
     * RESOURCE QUOTA
     * ======================
     */
    await resourceQuotaApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        hard: { cpu: `${namespace.limits.cpu}`, memory: `${namespace.limits.memory}` },
        scopeSelector: {
          matchExpressions: [{ operator: 'In', scopeName: 'PriorityClass', values: [name] }],
        },
      },
    });

    /**
     * ======================
     * SECRETS
     * ======================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      stringData: {
        MINIO_BUCKET: name,
        MONGO_DATABASE_NAME: name,
      },
    });
    await secretApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name: `${name}-api-keys` },
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
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name: `${name}-api`,
      },
      spec: {
        ports: [{ name: 'tcp', port: 3000 }],
        selector: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
      },
    });
    await statefulSetApiV1.delete(`${name}-api`, 'dynamic');
    await statefulSetApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name: `${name}-api`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        },
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
    await statefulSetApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
        name: `${name}-cdc`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
        },
        serviceName: `${name}-cdc`,
        template: getCdcPodTemplate(namespace),
      },
    });

    /**
     * ======================
     * CONNECTOR
     * ======================
     */
    const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
    if (isDevelopment) {
      await statefulSetApiV1.delete(`${name}-connector`, 'dynamic');
      await statefulSetApiV1.createOrReplace('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Connector },
          name: `${name}-connector`,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              ...labels,
              'tenlastic.com/role': NamespaceStatusComponentName.Connector,
            },
          },
          serviceName: `${name}-connector`,
          template: {
            metadata: {
              labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Connector },
              name: `${name}-connector`,
            },
            spec: {
              affinity: getAffinity(namespace, NamespaceStatusComponentName.Connector),
              containers: [
                getAggregationApiConnectorContainerTemplate(namespace),
                getApiConnectorContainerTemplate(namespace),
                getSocialApiConnectorContainerTemplate(namespace),
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
      await statefulSetApiV1.delete(`${name}-connector`, 'dynamic');
      await statefulSetApiV1.createOrReplace('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Connector },
          name: `${name}-connector`,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              ...labels,
              'tenlastic.com/role': NamespaceStatusComponentName.Connector,
            },
          },
          serviceName: `${name}-connector`,
          template: {
            metadata: {
              labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Connector },
              name: `${name}-connector`,
            },
            spec: {
              affinity: getAffinity(namespace, NamespaceStatusComponentName.Connector),
              containers: [
                getAggregationApiConnectorContainerTemplate(namespace),
                getApiConnectorContainerTemplate(namespace),
                getSocialApiConnectorContainerTemplate(namespace),
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
    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        name: `${name}-metrics`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        },
        template: getMetricsPodTemplate(namespace),
      },
    });

    /**
     * ======================
     * MIGRATIONS
     * ======================
     */
    await jobApiV1.delete(`${name}-migrations`, 'dynamic');
    await jobApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Migrations },
        name: `${name}-migrations`,
      },
      spec: { template: getMigrationsPodTemplate(namespace) },
    });
  },
};

function getAffinity(namespace: NamespaceDocument, role: NamespaceStatusComponentName): V1Affinity {
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

  const collectionNames = ['match-invitations', 'matches', 'queue-members', 'storefronts'];
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
  const resources = { requests: { cpu: '25m', memory: '75M' } };

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

  const collectionNames = ['authorizations', 'namespaces', 'users'];
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
    {
      name: 'WHERE',
      value: JSON.stringify({
        authorizations: { namespaceId: namespace._id },
        namespaces: { _id: namespace._id },
      }),
    },
  ];
  const resources = { requests: { cpu: '25m', memory: '75M' } };

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
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name: `${name}-api`,
      },
      spec: {
        affinity: getAffinity(namespace, NamespaceStatusComponentName.API),
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env: [{ name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } }],
            envFrom,
            image: `tenlastic/node-development:latest`,
            livenessProbe: { ...livenessProbe, initialDelaySeconds: 30 },
            name: 'main',
            readinessProbe,
            resources: { limits: { cpu: '1000m' }, requests: resources.requests },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: `/usr/src/nodejs/applications/namespace-api/`,
          },
        ],
        serviceAccountName: `namespace-api`,
        volumes: [
          { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.API },
        name,
      },
      spec: {
        affinity: getAffinity(namespace, NamespaceStatusComponentName.API),
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
        serviceAccountName: `namespace-api`,
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
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
        name: `${name}-cdc`,
      },
      spec: {
        affinity: getAffinity(namespace, NamespaceStatusComponentName.CDC),
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
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.CDC },
        name,
      },
      spec: {
        affinity: getAffinity(namespace, NamespaceStatusComponentName.CDC),
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
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        name: `${name}-metrics`,
      },
      spec: {
        affinity: getAffinity(namespace, NamespaceStatusComponentName.Metrics),
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
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Metrics },
        name,
      },
      spec: {
        affinity: getAffinity(namespace, NamespaceStatusComponentName.Metrics),
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

function getMigrationsPodTemplate(namespace: NamespaceDocument): V1Pod {
  const labels = KubernetesNamespace.getLabels(namespace);
  const name = KubernetesNamespace.getName(namespace._id);

  const envFrom: V1EnvFromSource[] = [{ secretRef: { name: 'nodejs' } }, { secretRef: { name } }];
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': NamespaceStatusComponentName.Migrations },
        name: `${name}-migrations`,
      },
      spec: {
        affinity: getAffinity(namespace, NamespaceStatusComponentName.Migrations),
        containers: [
          {
            command: ['npm', 'run', 'start'],
            envFrom,
            image: `tenlastic/node-development:latest`,
            name: 'main',
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
        affinity: getAffinity(namespace, NamespaceStatusComponentName.Migrations),
        containers: [
          {
            envFrom,
            image: `tenlastic/namespace-api-migrations:${version}`,
            name: 'main',
            resources,
          },
        ],
        restartPolicy: 'OnFailure',
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

function getSocialApiConnectorContainerTemplate(namespace: NamespaceDocument): V1Container {
  const name = KubernetesNamespace.getName(namespace._id);

  const collectionNames = ['groups'];
  const env: V1EnvVar[] = [
    { name: 'MONGO_COLLECTION_NAMES', value: collectionNames.join(',') },
    {
      name: 'MONGO_FROM_CONNECTION_STRING',
      valueFrom: { secretKeyRef: { key: 'MONGO_CONNECTION_STRING', name: 'nodejs' } },
    },
    {
      name: 'MONGO_FROM_DATABASE_NAME',
      value: 'social-api',
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
  const resources = { requests: { cpu: '25m', memory: '75M' } };

  const isDevelopment = process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/');
  if (isDevelopment) {
    return {
      command: ['npm', 'run', 'start'],
      env,
      image: `tenlastic/node-development:latest`,
      name: 'social-api',
      resources: { limits: { cpu: '1000m' }, requests: resources.requests },
      volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
      workingDir: `/usr/src/nodejs/applications/connector/`,
    };
  } else {
    return {
      env,
      image: `tenlastic/connector:${version}`,
      name: 'social-api',
      resources,
    };
  }
}

async function upsertAuthorization(
  name: string,
  namespaceId: mongoose.Types.ObjectId,
  roles: AuthorizationRole[],
): Promise<AuthorizationDocument> {
  const apiKey = chance.hash({ length: 64 });

  try {
    return await AuthorizationModel.create({ apiKey, name, namespaceId, roles, system: true });
  } catch (e) {
    if (e.name !== 'DuplicateKeyError') {
      throw e;
    }

    return await AuthorizationModel.findOne({ name, namespaceId });
  }
}
