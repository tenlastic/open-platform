import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { BuildDocument, BuildEvent } from '../../models/build';
import { NamespaceDocument } from '../../models/namespace';
import { KubernetesBuild } from '../build';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

BuildEvent.sync(async payload => {
  const build = payload.fullDocument;

  if (!build.populated('namespaceDocument')) {
    await build.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'insert') {
    await KubernetesBuildSidecar.create(build, build.namespaceDocument);
  }
});

export const KubernetesBuildSidecar = {
  create: async (build: BuildDocument, namespace: NamespaceDocument) => {
    const buildName = KubernetesBuild.getName(build);
    const name = KubernetesBuildSidecar.getName(build);

    const uid = await getBuildUid(build, namespace.kubernetesNamespace);
    const ownerReferences = [
      {
        apiVersion: 'argoproj.io/v1alpha1',
        controller: true,
        kind: 'Workflow',
        name: buildName,
        uid,
      },
    ];

    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(namespace.kubernetesNamespace, {
      metadata: { name, ownerReferences },
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
    await coreV1.createNamespacedServiceAccount(namespace.kubernetesNamespace, {
      metadata: { name, ownerReferences },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(namespace.kubernetesNamespace, {
      metadata: { name, ownerReferences },
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
    const administrator = { roles: ['builds'], system: true };
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
      { name: 'LOG_CONTAINER', value: 'main' },
      { name: 'LOG_ENDPOINT', value: `http://api.default:3000/builds/${build._id}/logs` },
      { name: 'LOG_POD_LABEL_SELECTOR', value: `app=${buildName},role=application` },
      { name: 'LOG_POD_NAMESPACE', value: namespace.kubernetesNamespace },
      { name: 'WORKFLOW_ENDPOINT', value: `http://api.default:3000/builds/${build._id}` },
      { name: 'WORKFLOW_NAME', value: buildName },
      { name: 'WORKFLOW_NAMESPACE', value: namespace.kubernetesNamespace },
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
            app: buildName,
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
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/log-sidecar/',
            },
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir:
                '/usr/src/app/projects/javascript/nodejs/applications/workflow-status-sidecar/',
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
            app: buildName,
            role: 'sidecar',
          },
          name,
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
              image: `tenlastic/workflow-status-sidecar:${version}`,
              name: 'workflow-status-sidecar',
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
          app: buildName,
          role: 'sidecar',
        },
        name,
        ownerReferences,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: buildName,
            role: 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
  getName(build: BuildDocument) {
    return `build-${build._id}-sidecar`;
  },
};

async function getBuildUid(build: BuildDocument, namespace: string): Promise<string> {
  try {
    const response: any = await customObjects.getNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      namespace,
      'workflows',
      KubernetesBuild.getName(build),
    );

    return response.body.metadata.uid;
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getBuildUid(build, namespace);
  }
}
