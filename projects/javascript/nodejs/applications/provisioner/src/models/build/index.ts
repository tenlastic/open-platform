import { networkPolicyApiV1, secretApiV1, V1Workflow, workflowApiV1 } from '@tenlastic/kubernetes';
import { BuildDocument, Namespace, NamespaceRole } from '@tenlastic/mongoose-models';
import { URL } from 'url';

import { KubernetesNamespace } from '../namespace';

export const KubernetesBuild = {
  delete: async (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * WORKFLOW
     * ======================
     */
    await workflowApiV1.delete(name, 'dynamic');
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
  upsert: async (build: BuildDocument) => {
    const labels = KubernetesBuild.getLabels(build);
    const name = KubernetesBuild.getName(build);
    const namespace = KubernetesNamespace.getName(build.namespaceId);

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
    const accessToken = Namespace.getAccessToken(build.namespaceId, [NamespaceRole.Builds]);
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        BUILD_ID: `${build._id}`,
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
    const podLabels = {
      ...labels,
      'tenlastic.com/nodeId': `{{pod.name}}`,
      'tenlastic.com/role': 'application',
    };
    const { version } = require('../../../package.json');

    let manifest: V1Workflow;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/projects/')) {
      const workingDir = '/usr/src/projects/javascript/nodejs/applications';
      manifest = {
        metadata: {
          labels: {
            ...labels,
            'tenlastic.com/role': 'application',
            'workflows.argoproj.io/controller-instanceid': namespace,
          },
          name,
        },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          entrypoint: 'entrypoint',
          podMetadata: { labels: { 'tenlastic.com/app': name } },
          retryStrategy: {
            backoff: { duration: '15', factor: '2' },
            limit: 4,
            retryStrategy: 'Always',
          },
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
                envFrom: [{ secretRef: { name } }],
                image: 'node:14',
                resources: { requests: { cpu: '100m', memory: '100M' } },
                volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
                workingDir: `${workingDir}/build/`,
              },
              metadata: { labels: podLabels },
              name: 'copy-and-unzip-files',
            },
          ],
          ttlStrategy: { secondsAfterCompletion: 3 * 60 * 60 },
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: { 'workflows.argoproj.io/controller-instanceid': namespace },
          name,
        },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          entrypoint: 'entrypoint',
          podMetadata: { labels: { 'tenlastic.com/app': name } },
          retryStrategy: {
            backoff: { duration: '15', factor: '2' },
            limit: 2,
            retryStrategy: 'Always',
          },
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
                envFrom: [{ secretRef: { name } }],
                image: `tenlastic/build:${version}`,
                resources: { requests: { cpu: '100m', memory: '100M' } },
                volumeMounts: [],
                workingDir: '/usr/src/',
              },
              metadata: { labels: podLabels },
              name: 'copy-and-unzip-files',
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
          image: `gcr.io/kaniko-project/executor:v1.8.0`,
          resources: { requests: { cpu: '100m', memory: '100M' } },
          volumeMounts: [
            { mountPath: '/kaniko/.docker/', name: 'docker-registry', readOnly: true },
            { mountPath: '/workspace/', name: 'workspace' },
          ],
        },
        metadata: { labels: podLabels },
        name: 'build-docker-image',
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

    const response = await workflowApiV1.createOrReplace('dynamic', manifest);

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
    await secretApiV1.patch(name, 'dynamic', { metadata: { ownerReferences } });
  },
};
