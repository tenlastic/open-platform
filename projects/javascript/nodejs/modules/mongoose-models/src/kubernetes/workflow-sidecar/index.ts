import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { WorkflowDocument } from '../../models';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

export const WorkflowSidecar = {
  create: async (workflow: WorkflowDocument) => {
    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(workflow.kubernetesNamespace, {
      metadata: {
        name: `${workflow.kubernetesName}-sidecar`,
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
    await coreV1.createNamespacedServiceAccount(workflow.kubernetesNamespace, {
      metadata: {
        name: `${workflow.kubernetesName}-sidecar`,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(workflow.kubernetesNamespace, {
      metadata: {
        name: `${workflow.kubernetesName}-sidecar`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: `${workflow.kubernetesName}-sidecar`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${workflow.kubernetesName}-sidecar`,
          namespace: workflow.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const administrator = { roles: ['workflows'], system: true };
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
                  key: workflow.isPreemptible
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
      { name: 'LOG_ENDPOINT', value: `http://api.default:3000/workflows/${workflow._id}/logs` },
      { name: 'LOG_POD_LABEL_SELECTOR', value: `app=${workflow.kubernetesName},role=application` },
      { name: 'LOG_POD_NAMESPACE', value: workflow.kubernetesNamespace },
      { name: 'WORKFLOW_ENDPOINT', value: `http://api.default:3000/workflows/${workflow._id}` },
      { name: 'WORKFLOW_NAME', value: workflow.kubernetesName },
      { name: 'WORKFLOW_NAMESPACE', value: workflow.kubernetesNamespace },
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
            app: workflow.kubernetesName,
            role: 'sidecar',
          },
          name: `${workflow.kubernetesName}-sidecar`,
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
            ,
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
          serviceAccountName: `${workflow.kubernetesName}-sidecar`,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: {
            app: workflow.kubernetesName,
            role: 'sidecar',
          },
          name: `${workflow.kubernetesName}-sidecar`,
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
          serviceAccountName: `${workflow.kubernetesName}-sidecar`,
        },
      };
    }

    await appsV1.createNamespacedDeployment(workflow.kubernetesNamespace, {
      metadata: {
        labels: {
          app: workflow.kubernetesName,
          role: 'sidecar',
        },
        name: `${workflow.kubernetesName}-sidecar`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: workflow.kubernetesName,
            role: 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
  delete: async (workflow: WorkflowDocument) => {
    /**
     * ======================
     * RBAC
     * ======================
     */
    try {
      await rbacAuthorizationV1.deleteNamespacedRole(
        `${workflow.kubernetesName}-sidecar`,
        workflow.kubernetesNamespace,
      );
      await coreV1.deleteNamespacedServiceAccount(
        `${workflow.kubernetesName}-sidecar`,
        workflow.kubernetesNamespace,
      );
      await rbacAuthorizationV1.deleteNamespacedRoleBinding(
        `${workflow.kubernetesName}-sidecar`,
        workflow.kubernetesNamespace,
      );
    } catch {}

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    try {
      await appsV1.deleteNamespacedDeployment(
        `${workflow.kubernetesName}-sidecar`,
        workflow.kubernetesNamespace,
      );
    } catch {}
  },
};
