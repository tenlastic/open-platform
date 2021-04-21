import { BuildDocument, BuildEvent } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { URL } from 'url';

import {
  roleApiV1,
  roleBindingApiV1,
  roleStackApiV1,
  secretApiV1,
  serviceAccountApiV1,
  workflowApiV1,
} from '../apis';
import { KubernetesNamespace } from '../namespace';

BuildEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesBuild.delete(payload.fullDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesBuild.upsert(payload.fullDocument);
  }
});

export const KubernetesBuild = {
  delete: async (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);
    const namespace = KubernetesNamespace.getName(build.namespaceId);

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await workflowApiV1.delete(name, namespace);
  },
  getName(build: BuildDocument) {
    return `build-${build._id}`;
  },
  upsert: async (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);
    const namespace = KubernetesNamespace.getName(build.namespaceId);

    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    const secret = await secretApiV1.read('docker-registry-image-pull-secret', 'default');
    await secretApiV1.createOrReplace(namespace, {
      data: { 'config.json': secret.body.data['.dockerconfigjson'] },
      metadata: {
        labels: { 'tenlastic.com/app': name, 'tenlastic.com/role': 'image-pull-secret' },
        name: `${name}-image-pull-secret`,
      },
      type: 'Opaque',
    });

    /**
     * ======================
     * RBAC
     * ======================
     */
    await roleStackApiV1.createOrReplace(namespace, {
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

    /**
     * ======================
     * SECRET
     * ======================
     */
    const administrator = { roles: ['builds'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
    await secretApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': name,
          'tenlastic.com/role': 'application',
        },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        BUILD_ID: build._id.toString(),
        MINIO_BUCKET: process.env.MINIO_BUCKET,
        MINIO_CONNECTION_STRING: process.env.MINIO_CONNECTION_STRING,
      },
    });

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    const affinity = {
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
    };
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
                envFrom: [{ secretRef: { name } }],
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
                envFrom: [{ secretRef: { name } }],
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
            secret: { secretName: `${name}-image-pull-secret` },
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

    const response = await workflowApiV1.createOrReplace(namespace, manifest);

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
    await secretApiV1.patch(`${name}-image-pull-secret`, namespace, {
      metadata: { ownerReferences },
    });
    await roleApiV1.patch(name, namespace, { metadata: { ownerReferences } });
    await serviceAccountApiV1.patch(name, namespace, { metadata: { ownerReferences } });
    await roleBindingApiV1.patch(name, namespace, { metadata: { ownerReferences } });
    await secretApiV1.patch(name, namespace, { metadata: { ownerReferences } });
  },
};
