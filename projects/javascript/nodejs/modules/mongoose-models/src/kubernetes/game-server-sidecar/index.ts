import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { GameServerDocument, GameServerEvent } from '../../models/game-server';
import { NamespaceDocument } from '../../models/namespace';
import { KubernetesGameServer } from '../game-server';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

GameServerEvent.sync(async payload => {
  const gameServer = payload.fullDocument;

  if (!gameServer.populated('namespaceDocument')) {
    await gameServer.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesGameServerSidecar.delete(gameServer, gameServer.namespaceDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesGameServerSidecar.create(gameServer, gameServer.namespaceDocument);
  }
});

export const KubernetesGameServerSidecar = {
  create: async (gameServer: GameServerDocument, namespace: NamespaceDocument) => {
    const gameServerName = KubernetesGameServer.getName(gameServer);
    const name = KubernetesGameServerSidecar.getName(gameServer);

    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.createClusterRole({
      metadata: { name },
      rules: [
        {
          apiGroups: [''],
          resources: ['nodes'],
          verbs: ['get'],
        },
      ],
    });
    await rbacAuthorizationV1.createNamespacedRole(namespace.kubernetesNamespace, {
      metadata: { name },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['nodes'],
          verbs: ['get'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(namespace.kubernetesNamespace, {
      metadata: { name },
    });
    await rbacAuthorizationV1.createClusterRoleBinding({
      metadata: { name },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name,
          namespace: namespace.kubernetesNamespace,
        },
      ],
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(namespace.kubernetesNamespace, {
      metadata: { name },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name,
          namespace: namespace.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const administrator = { roles: ['game-servers'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: gameServer.isPreemptible
                    ? 'tenlastic.com/low-priority'
                    : 'tenlastic.com/high-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
    };
    const env = [
      { name: 'ACCESS_TOKEN', value: accessToken },
      { name: 'GAME_SERVER_CONTAINER', value: 'main' },
      {
        name: 'GAME_SERVER_ENDPOINT',
        value: `http://api.default:3000/game-servers/${gameServer._id}`,
      },
      {
        name: 'GAME_SERVER_POD_LABEL_SELECTOR',
        value: `app=${gameServerName},role=application`,
      },
      { name: 'GAME_SERVER_POD_NAMESPACE', value: namespace.kubernetesNamespace },
      { name: 'LOG_CONTAINER', value: 'main' },
      {
        name: 'LOG_ENDPOINT',
        value: `http://api.default:3000/game-servers/${gameServer._id}/logs`,
      },
      {
        name: 'LOG_POD_LABEL_SELECTOR',
        value: `app=${gameServerName},role=application`,
      },
      { name: 'LOG_POD_NAMESPACE', value: namespace.kubernetesNamespace },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            app: gameServerName,
            role: 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'game-server-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir:
                '/usr/src/app/projects/javascript/nodejs/applications/game-server-sidecar/',
            },
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/log-sidecar/',
            },
          ],
          serviceAccountName: name,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: {
            app: gameServerName,
            role: 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/game-server-sidecar:${version}`,
              name: 'game-server-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
            {
              env,
              image: `tenlastic/log-sidecar:${version}`,
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
          ],
          serviceAccountName: name,
        },
      };
    }

    await appsV1.createNamespacedDeployment(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          app: gameServerName,
          role: 'sidecar',
        },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: gameServerName,
            role: 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
  delete: async (gameServer: GameServerDocument, namespace: NamespaceDocument) => {
    const name = KubernetesGameServerSidecar.getName(gameServer);

    /**
     * ======================
     * RBAC
     * ======================
     */
    try {
      await rbacAuthorizationV1.deleteClusterRole(name);
      await rbacAuthorizationV1.deleteNamespacedRole(name, namespace.kubernetesNamespace);
      await coreV1.deleteNamespacedServiceAccount(name, namespace.kubernetesNamespace);
      await rbacAuthorizationV1.deleteClusterRoleBinding(name);
      await rbacAuthorizationV1.deleteNamespacedRoleBinding(name, namespace.kubernetesNamespace);
    } catch {}

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    try {
      await appsV1.deleteNamespacedDeployment(name, namespace.kubernetesNamespace);
    } catch {}
  },
  getName(gameServer: GameServerDocument) {
    return `game-server-${gameServer._id}-sidecar`;
  },
};
