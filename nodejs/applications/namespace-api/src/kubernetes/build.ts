import { V1EnvFromSource, V1EnvVar } from '@kubernetes/client-node';
import { networkPolicyApiV1, secretApiV1, V1Workflow, workflowApiV1 } from '@tenlastic/kubernetes';
import { DatabaseOperationType } from '@tenlastic/mongoose-models';
import { URL } from 'url';

import { version } from '../../package.json';
import { BuildDocument } from '../mongodb';
import { KubernetesNamespace } from './namespace';

export const KubernetesBuild = {
  delete: async (build: BuildDocument, operationType?: DatabaseOperationType) => {
    const name = KubernetesBuild.getName(build);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    if (operationType === 'delete') {
      await workflowApiV1.delete(name, 'dynamic');
    }
  },
  getLabels: (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/buildId': `${build._id}`,
      'tenlastic.com/namespaceId': `${build.namespaceId}`,
    };
  },
  getName: (build: BuildDocument) => {
    return `build-${build._id}`;
  },
  terminate: async (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await workflowApiV1.patch(name, 'dynamic', { spec: { shutdown: 'Terminate' } });
  },
  upsert: async (build: BuildDocument) => {
    const labels = KubernetesBuild.getLabels(build);
    const name = KubernetesBuild.getName(build);
    const namespaceName = KubernetesNamespace.getName(build.namespaceId);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        API_URL: `http://${namespaceName}-api.dynamic:3000`,
        BUILD_ID: `${build._id}`,
        NAMESPACE_ID: `${build.namespaceId}`,
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
    const env: V1EnvVar[] = [
      {
        name: 'API_KEY',
        valueFrom: { secretKeyRef: { key: 'BUILDS', name: `${namespaceName}-api-keys` } },
      },
    ];
    const envFrom: V1EnvFromSource[] = [
      { secretRef: { name: 'nodejs' } },
      { secretRef: { name: namespaceName } },
      { secretRef: { name } },
    ];
    const podLabels = {
      ...labels,
      'tenlastic.com/nodeId': `{{pod.name}}`,
      'tenlastic.com/role': 'application',
    };
    const retryStrategy = {
      backoff: { duration: '15', factor: '2' },
      limit: 2,
      retryStrategy: 'Always',
    };

    let manifest: V1Workflow;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      const workingDir = '/usr/src/nodejs/applications';
      manifest = {
        metadata: {
          labels: {
            ...labels,
            'tenlastic.com/role': 'application',
          },
          name,
        },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          entrypoint: 'entrypoint',
          podMetadata: { labels: { 'tenlastic.com/app': name } },
          podPriorityClassName: namespaceName,
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
                command: ['npm', 'run', 'start'],
                env,
                envFrom,
                image: 'tenlastic/node-development:latest',
                resources: { requests: { cpu: '100m', memory: '100Mi' } },
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
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'host' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
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
                args: ['node', './dist/index.js'],
                command: ['/sbin/tini --', '--'],
                env,
                envFrom,
                image: `tenlastic/build:${version}`,
                resources: { requests: { cpu: '100m', memory: '100Mi' } },
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
            '--context=dir:///workspace/',
            `--destination=${image}`,
            `--dockerfile=${build.entrypoint}`,
            '--push-retry=2',
            ...args,
          ],
          command: ['/kaniko/executor'],
          image: `gcr.io/kaniko-project/executor:v1.8.1`,
          resources: { requests: { cpu: '100m', memory: '100Mi' } },
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
                storage: '10Gi',
              },
            },
            storageClassName: 'balanced-expandable',
          },
        },
      ];
    }

    await workflowApiV1.createOrReplace('dynamic', manifest);
  },
};
