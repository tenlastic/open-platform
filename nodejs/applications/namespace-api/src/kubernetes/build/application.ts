import { V1EnvFromSource, V1EnvVar } from '@kubernetes/client-node';
import { V1Workflow, workflowApiV1 } from '@tenlastic/kubernetes';
import { BuildDocument, BuildPlatform } from '@tenlastic/mongoose';
import { DatabaseOperationType } from '@tenlastic/mongoose-nats';
import { URL } from 'url';

import { version } from '../../../package.json';
import { KubernetesNamespace } from '../namespace';
import { KubernetesBuild } from './';

export const KubernetesBuildApplication = {
  delete: async (build: BuildDocument, operationType?: DatabaseOperationType) => {
    const name = KubernetesBuild.getName(build);

    if (operationType === 'delete') {
      await workflowApiV1.delete(name, 'dynamic');
    }
  },
  terminate: async (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);

    await workflowApiV1.patch(name, 'dynamic', { spec: { shutdown: 'Terminate' } });
  },
  upsert: async (build: BuildDocument) => {
    const labels = KubernetesBuild.getLabels(build);
    const name = KubernetesBuild.getName(build);
    const namespaceName = KubernetesNamespace.getName(build.namespaceId);

    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            { matchExpressions: [{ key: 'tenlastic.com/low-priority', operator: 'Exists' }] },
          ],
        },
      },
    };
    const env: V1EnvVar[] = [
      {
        name: 'API_KEY',
        valueFrom: { secretKeyRef: { key: 'BUILDS', name: `${namespaceName}-api-keys` } },
      },
      { name: 'API_URL', value: `http://${namespaceName}-api.dynamic:3000` },
      { name: 'BUILD_ID', value: `${build._id}` },
      { name: 'NAMESPACE_ID', value: `${build.namespaceId}` },
    ];
    const envFrom: V1EnvFromSource[] = [
      { secretRef: { name: 'nodejs' } },
      { secretRef: { name: namespaceName } },
    ];
    const podLabels = {
      ...labels,
      'tenlastic.com/nodeId': `{{pod.name}}`,
      'tenlastic.com/role': 'Application',
    };
    const retryStrategy = {
      backoff: { duration: '15', factor: '2' },
      limit: 2,
      retryStrategy: 'Always',
    };

    let manifest: V1Workflow;
    if (KubernetesNamespace.isDevelopment) {
      const workingDir = '/usr/src/nodejs/applications';
      manifest = {
        metadata: { labels: { ...labels, 'tenlastic.com/role': 'Application' }, name },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          entrypoint: 'entrypoint',
          podMetadata: { labels: { 'tenlastic.com/app': name } },
          podPriorityClassName: namespaceName,
          serviceAccountName: 'build',
          templates: [
            {
              dag: { tasks: [{ name: 'copy-and-unzip-files', template: 'copy-and-unzip-files' }] },
              metadata: { labels: podLabels },
              name: 'entrypoint',
            },
            {
              container: {
                command: ['npm', 'run', 'start'],
                env,
                envFrom,
                image: 'tenlastic/node-development:latest',
                imagePullPolicy: 'IfNotPresent',
                resources: { requests: { cpu: '100m', memory: '100M' } },
                volumeMounts: [{ mountPath: '/usr/src/', name: 'host' }],
                workingDir: `${workingDir}/build/`,
              },
              metadata: { labels: podLabels },
              name: 'copy-and-unzip-files',
              retryStrategy,
            },
          ],
          ttlStrategy: { secondsAfterCompletion: 3 * 60 * 60 },
          volumes: [
            { hostPath: { path: '/usr/src/open-platform/' }, name: 'host' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'Application' },
          name,
        },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          entrypoint: 'entrypoint',
          podMetadata: { labels: { 'tenlastic.com/app': name } },
          serviceAccountName: 'build',
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
              metadata: { labels: podLabels },
              name: 'entrypoint',
            },
            {
              container: {
                args: ['./dist/entrypoint.js'],
                command: ['node'],
                env,
                envFrom,
                image: `tenlastic/build:${version}`,
                resources: { requests: { cpu: '100m', memory: '100M' } },
                volumeMounts: [],
                workingDir: '/usr/src/',
              },
              metadata: { labels: podLabels },
              name: 'copy-and-unzip-files',
              retryStrategy,
            },
          ],
          ttlStrategy: { secondsAfterCompletion: 3 * 60 * 60 },
        },
      };
    }

    if (build.platform === BuildPlatform.Server64) {
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
            '--context=dir:///workspace/',
            `--destination=${image}`,
            `--dockerfile=${build.entrypoint}`,
            '--push-retry=2',
            ...args,
          ],
          command: ['/kaniko/executor'],
          image: `gcr.io/kaniko-project/executor:v1.8.1`,
          resources: { requests: { cpu: '100m', memory: '100M' } },
          volumeMounts: [
            { mountPath: '/kaniko/.docker/', name: 'docker-registry', readOnly: true },
            { mountPath: '/workspace/', name: 'workspace' },
          ],
        },
        metadata: { labels: podLabels },
        name: 'build-docker-image',
        retryStrategy,
        volumes: [
          {
            name: 'docker-registry',
            secret: {
              items: [{ key: '.dockerconfigjson', path: 'config.json' }],
              secretName: 'docker-registry',
            },
          },
        ],
      });

      manifest.spec.volumeClaimTemplates = [
        {
          metadata: { name: 'workspace' },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: '10G',
              },
            },
            storageClassName: 'balanced-expandable',
          },
        },
      ];
    }

    return workflowApiV1.createOrReplace('dynamic', manifest);
  },
};
