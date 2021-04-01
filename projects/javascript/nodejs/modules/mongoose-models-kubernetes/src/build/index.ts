import * as k8s from '@kubernetes/client-node';
import { BuildDocument, BuildEvent, NamespaceDocument } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { URL } from 'url';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

BuildEvent.sync(async payload => {
  const build = payload.fullDocument;

  if (!build.populated('namespaceDocument')) {
    await build.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'delete') {
    await KubernetesBuild.delete(build, build.namespaceDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesBuild.create(build, build.namespaceDocument);
  }
});

export const KubernetesBuild = {
  create: async (build: BuildDocument, namespace: NamespaceDocument) => {
    const name = KubernetesBuild.getName(build);

    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    const secret = await coreV1.readNamespacedSecret(
      'docker-registry-image-pull-secret',
      'default',
    );
    await coreV1.createNamespacedSecret(namespace.kubernetesNamespace, {
      data: { 'config.json': secret.body.data['.dockerconfigjson'] },
      metadata: { name },
      type: 'Opaque',
    });

    /**
     * ======================
     * RBAC
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(namespace.kubernetesNamespace, {
      metadata: { name },
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
    await coreV1.createNamespacedServiceAccount(namespace.kubernetesNamespace, {
      metadata: { name },
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
     * WORKFLOW
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
      { name: 'BUILD_ID', value: build._id.toString() },
      { name: 'MINIO_BUCKET', value: process.env.MINIO_BUCKET },
      { name: 'MINIO_CONNECTION_STRING', value: process.env.MINIO_CONNECTION_STRING },
    ];
    const metadata = {
      annotations: {
        'tenlastic.com/buildId': build._id.toString(),
        'tenlastic.com/nodeId': `{{pod.name}}`,
      },
      labels: {
        'tenlastic.com/app': name,
        'tenlastic.com/role': 'application',
      },
    };

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    let manifest: any;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      const workingDir = '/usr/src/app/projects/javascript/nodejs/applications';
      manifest = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: { name },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          entrypoint: 'entrypoint',
          serviceAccountName: name,
          templates: [
            {
              dag: {
                tasks: [
                  {
                    name: 'copy-and-unzip-files',
                    template: 'copy-and-unzip-files',
                  },
                ],
              },
              metadata,
              name: 'entrypoint',
            },
            {
              container: {
                command: ['npm', 'run', 'start'],
                env,
                image: 'node:12',
                resources: { requests: { cpu: '100m', memory: '100M' } },
                volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
                workingDir: `${workingDir}/build/`,
              },
              metadata,
              name: 'copy-and-unzip-files',
            },
          ],
          ttlStrategy: { secondsAfterCompletion: 30 },
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      manifest = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: { name },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          entrypoint: 'entrypoint',
          serviceAccountName: name,
          templates: [
            {
              dag: {
                tasks: [
                  {
                    name: 'copy-and-unzip-files',
                    template: 'copy-and-unzip-files',
                  },
                ],
              },
              metadata,
              name: 'entrypoint',
            },
            {
              container: {
                env,
                image: `tenlastic/build:${version}`,
                resources: { requests: { cpu: '100m', memory: '100M' } },
                workingDir: '/usr/src/app/',
              },
              metadata,
              name: 'copy-and-unzip-files',
              volumeMounts: [],
            },
          ],
          ttlStrategy: { secondsAfterCompletion: 30 },
        },
      };
    }

    if (build.platform === 'server64') {
      manifest.spec.templates[0].dag.tasks.push({
        dependencies: ['copy-and-unzip-files'],
        name: 'build-docker-image',
        template: 'build-docker-image',
      });

      manifest.spec.templates[1].container.volumeMounts.push({
        mountPath: '/workspace/',
        name: 'workspace',
      });

      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const image = `${url.host}/${build.namespaceId}:${build._id}`;
      const args = url.protocol === 'http:' ? ['--insecure', '--skip-tls-verify'] : [];
      manifest.spec.templates.push({
        container: {
          args: [
            `--dockerfile=${build.entrypoint}`,
            '--context=dir:///workspace/',
            `--destination=${image}`,
            ...args,
          ],
          image: `gcr.io/kaniko-project/executor:v1.5.0`,
          resources: { requests: { cpu: '100m', memory: '100M' } },
          volumeMounts: [
            { mountPath: '/kaniko/.docker/', name: 'kaniko', readOnly: true },
            { mountPath: '/workspace/', name: 'workspace' },
          ],
        },
        metadata,
        name: 'build-docker-image',
        volumes: [
          {
            name: 'kaniko',
            secret: { secretName: name },
          },
        ],
      });

      manifest.spec.volumeClaimTemplates = [
        {
          metadata: {
            name: 'workspace',
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: '10Gi',
              },
            },
          },
        },
      ];
    }

    const response: any = await customObjects.createNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      namespace.kubernetesNamespace,
      'workflows',
      manifest,
    );

    /**
     * ======================
     * OWNER REFERENCES
     * ======================
     */
    const ownerReferences = [
      {
        apiVersion: 'argoproj.io/v1alpha1',
        controller: true,
        kind: 'Workflow',
        name,
        uid: response.body.metadata.uid,
      },
    ];
    await coreV1.patchNamespacedSecret(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await rbacAuthorizationV1.patchNamespacedRole(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await coreV1.patchNamespacedServiceAccount(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await rbacAuthorizationV1.patchNamespacedRoleBinding(
      name,
      namespace.kubernetesNamespace,
      { metadata: { ownerReferences } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
  },
  delete: async (build: BuildDocument, namespace: NamespaceDocument) => {
    const name = KubernetesBuild.getName(build);

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    try {
      await customObjects.deleteNamespacedCustomObject(
        'argoproj.io',
        'v1alpha1',
        namespace.kubernetesNamespace,
        'workflows',
        name,
      );
    } catch {}
  },
  getName(build: BuildDocument) {
    return `build-${build._id}`;
  },
};
