import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { BuildWorkflowDocument, NamespaceDocument } from '../../models';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

export const BuildWorkflow = {
  create: async (buildWorkflow: BuildWorkflowDocument, namespace: NamespaceDocument) => {
    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(buildWorkflow.kubernetesNamespace, {
      metadata: {
        name: `${buildWorkflow.kubernetesName}-application`,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods'],
          verbs: ['get', 'patch', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['pods/exec'],
          verbs: ['create'],
        },
        {
          apiGroups: [''],
          resources: ['pods/log'],
          verbs: ['get', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(buildWorkflow.kubernetesNamespace, {
      metadata: {
        name: `${buildWorkflow.kubernetesName}-application`,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(buildWorkflow.kubernetesNamespace, {
      metadata: {
        name: `${buildWorkflow.kubernetesName}-application`,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: `${buildWorkflow.kubernetesName}-application`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${buildWorkflow.kubernetesName}-application`,
          namespace: buildWorkflow.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    const administrator = { roles: ['game-servers'], system: true };
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
                  key: namespace.limits.workflows.preemptible
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
      { name: 'BUILD_WORKFLOW_ID', value: buildWorkflow._id.toString() },
      { name: 'MINIO_CONNECTION_STRING', value: process.env.MINIO_CONNECTION_STRING },
    ];

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      await customObjects.createNamespacedCustomObject(
        'argoproj.io',
        'v1alpha1',
        buildWorkflow.kubernetesNamespace,
        'workflows',
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Workflow',
          metadata: { name: buildWorkflow.kubernetesName },
          spec: {
            activeDeadlineSeconds: 60 * 60,
            affinity,
            entrypoint: 'entrypoint',
            podGC: { strategy: 'OnPodCompletion' },
            serviceAccountName: `${buildWorkflow.kubernetesName}-application`,
            templates: [
              {
                dag: {
                  tasks: [
                    {
                      name: 'copy-delete-unzip',
                      template: 'copy-delete-unzip',
                    },
                  ],
                },
                name: 'entrypoint',
              },
              {
                container: {
                  command: ['npm', 'run', 'start'],
                  env,
                  image: 'node:12',
                  resources: { requests: { cpu: '100m', memory: '100M' } },
                  volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
                  workingDir:
                    '/usr/src/app/projects/javascript/nodejs/applications/copy-delete-unzip/',
                },
                name: 'copy-delete-unzip',
              },
            ],
            ttlStrategy: { secondsAfterCompletion: 30 },
            volumes: [
              { hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' },
            ],
          },
        },
      );
    } else {
      await customObjects.createNamespacedCustomObject(
        'argoproj.io',
        'v1alpha1',
        buildWorkflow.kubernetesNamespace,
        'workflows',
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Workflow',
          metadata: { name: buildWorkflow.kubernetesName },
          spec: {
            activeDeadlineSeconds: 60 * 60,
            affinity,
            entrypoint: 'entrypoint',
            podGC: { strategy: 'OnPodCompletion' },
            serviceAccountName: `${buildWorkflow.kubernetesName}-application`,
            templates: [
              {
                dag: {
                  tasks: [
                    {
                      name: 'copy-delete-unzip',
                      template: 'copy-delete-unzip',
                    },
                  ],
                },
                name: 'entrypoint',
              },
              {
                container: {
                  env,
                  image: `tenlastic/copy-delete-unzip:${version}`,
                  resources: { requests: { cpu: '100m', memory: '100M' } },
                  workingDir: '/usr/src/app/',
                },
                name: 'copy-delete-unzip',
              },
            ],
            ttlStrategy: { secondsAfterCompletion: 30 },
          },
        },
      );
    }
  },
  delete: async (workflow: BuildWorkflowDocument) => {
    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.deleteNamespacedRole(
      `${workflow.kubernetesName}-application`,
      workflow.kubernetesNamespace,
    );
    await coreV1.deleteNamespacedServiceAccount(
      `${workflow.kubernetesName}-application`,
      workflow.kubernetesNamespace,
    );
    await rbacAuthorizationV1.deleteNamespacedRoleBinding(
      `${workflow.kubernetesName}-application`,
      workflow.kubernetesNamespace,
    );

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await customObjects.deleteNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      workflow.kubernetesNamespace,
      'workflows',
      workflow.kubernetesName,
    );
  },
};
