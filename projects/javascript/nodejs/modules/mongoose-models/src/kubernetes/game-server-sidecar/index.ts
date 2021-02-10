import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { GameServerDocument } from '../../models';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

export const GameServerSidecar = {
  create: async (gameServer: GameServerDocument) => {
    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(gameServer.kubernetesNamespace, {
      metadata: {
        name: gameServer.kubernetesName,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(gameServer.kubernetesNamespace, {
      metadata: {
        name: gameServer.kubernetesName,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(gameServer.kubernetesNamespace, {
      metadata: {
        name: gameServer.kubernetesName,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: gameServer.kubernetesName,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: gameServer.kubernetesName,
          namespace: gameServer.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const administrator = { roles: ['game-servers'] };
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
      { name: 'GAME_SERVER_ID', value: gameServer._id.toHexString() },
      { name: 'GAME_SERVER_JSON', value: JSON.stringify(gameServer) },
      { name: 'POD_NAMESPACE', value: gameServer.kubernetesNamespace },
      { name: 'POD_SELECTOR', value: `app=${gameServer.kubernetesName},role=application` },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            app: gameServer.kubernetesName,
            role: 'sidecar',
          },
          name: `${gameServer.kubernetesName}-sidecar`,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'health-check',
              resources: { requests: { cpu: '50m', memory: '64M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/health-check/',
            },
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'logs',
              resources: { requests: { cpu: '50m', memory: '64M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/logs/',
            },
          ],
          restartPolicy: 'Always',
          serviceAccountName: gameServer.kubernetesName,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: {
            app: gameServer.kubernetesName,
            role: 'sidecar',
          },
          name: `${gameServer.kubernetesName}-sidecar`,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/health-check:${version}`,
              name: 'health-check',
              resources: { requests: { cpu: '50m', memory: '64M' } },
            },
            {
              env,
              image: `tenlastic/logs:${version}`,
              name: 'logs',
              resources: { requests: { cpu: '50m', memory: '64M' } },
            },
          ],
          restartPolicy: 'Always',
          serviceAccountName: gameServer.kubernetesName,
        },
      };
    }

    await appsV1.createNamespacedDeployment(gameServer.kubernetesNamespace, {
      metadata: {
        labels: {
          app: gameServer.kubernetesName,
          role: 'sidecar',
        },
        name: `${gameServer.kubernetesName}-sidecar`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: gameServer.kubernetesName,
            role: 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
  delete: async (gameServer: GameServerDocument) => {
    /**
     * ======================
     * RBAC
     * ======================
     */
    try {
      await rbacAuthorizationV1.deleteNamespacedRole(
        gameServer.kubernetesName,
        gameServer.kubernetesNamespace,
      );
      await coreV1.deleteNamespacedServiceAccount(
        gameServer.kubernetesName,
        gameServer.kubernetesNamespace,
      );
      await rbacAuthorizationV1.deleteNamespacedRoleBinding(
        gameServer.kubernetesName,
        gameServer.kubernetesNamespace,
      );
    } catch {}

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    try {
      await appsV1.deleteNamespacedDeployment(
        `${gameServer.kubernetesName}-sidecar`,
        gameServer.kubernetesNamespace,
      );
    } catch {}
  },
};
