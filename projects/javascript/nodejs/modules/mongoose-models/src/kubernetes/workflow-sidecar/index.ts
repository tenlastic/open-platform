import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { WorkflowDocument } from '../../models';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

export const WorkflowSidecar = {
  create: async (
    _id: mongoose.Types.ObjectId,
    endpoint: string,
    isPreemptible: boolean,
    name: string,
    namespace: string,
  ) => {
    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(namespace, {
      metadata: {
        name: `${name}-sidecar`,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: ['argoproj.io'],
          resources: ['workflows'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(namespace, {
      metadata: {
        name: `${name}-sidecar`,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(namespace, {
      metadata: {
        name: `${name}-sidecar`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: `${name}-sidecar`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${name}-sidecar`,
          namespace,
        },
      ],
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const administrator = { roles: ['builds', 'workflows'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: isPreemptible ? 'tenlastic.com/low-priority' : 'tenlastic.com/high-priority',
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
      { name: 'LOG_ENDPOINT', value: `${endpoint}/logs` },
      { name: 'LOG_POD_LABEL_SELECTOR', value: `app=${name},role=application` },
      { name: 'LOG_POD_NAMESPACE', value: namespace },
      { name: 'WORKFLOW_ENDPOINT', value: endpoint },
      { name: 'WORKFLOW_NAME', value: name },
      { name: 'WORKFLOW_NAMESPACE', value: namespace },
    ];

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            app: name,
            role: 'sidecar',
          },
          name: `${name}-sidecar`,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/log-sidecar/',
            },
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/workflow-sidecar/',
            },
          ],
          serviceAccountName: `${name}-sidecar`,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: {
            app: name,
            role: 'sidecar',
          },
          name: `${name}-sidecar`,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/log-sidecar:${version}`,
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
            {
              env,
              image: `tenlastic/workflow-sidecar:${version}`,
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
          ],
          serviceAccountName: `${name}-sidecar`,
        },
      };
    }

    await appsV1.createNamespacedDeployment(namespace, {
      metadata: {
        labels: {
          app: name,
          role: 'sidecar',
        },
        name: `${name}-sidecar`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: name,
            role: 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
  delete: async (name: string, namespace: string) => {
    /**
     * ======================
     * RBAC
     * ======================
     */
    try {
      await rbacAuthorizationV1.deleteNamespacedRole(`${name}-sidecar`, namespace);
      await coreV1.deleteNamespacedServiceAccount(`${name}-sidecar`, namespace);
      await rbacAuthorizationV1.deleteNamespacedRoleBinding(`${name}-sidecar`, namespace);
    } catch {}

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    try {
      await appsV1.deleteNamespacedDeployment(`${name}-sidecar`, namespace);
    } catch {}
  },
};
