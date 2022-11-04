import { V1EnvVar, V1PodTemplateSpec } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';

import { version } from '../../package.json';
import { BuildDocument } from '../mongodb';
import { KubernetesBuild } from './build';
import { KubernetesNamespace } from './namespace';

export const KubernetesBuildSidecar = {
  delete: async (build: BuildDocument) => {
    const name = KubernetesBuildSidecar.getName(build);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName: (build: BuildDocument) => {
    return `build-${build._id}-sidecar`;
  },
  upsert: async (build: BuildDocument) => {
    const buildLabels = KubernetesBuild.getLabels(build);
    const buildName = KubernetesBuild.getName(build);
    const name = KubernetesBuildSidecar.getName(build);
    const namespaceName = KubernetesNamespace.getName(build.namespaceId);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const { _id, namespaceId } = build;
    const host = `${namespaceName}-api.dynamic:3000`;
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
      { name: 'ENDPOINT', value: `http://${host}/namespaces/${namespaceId}/builds/${_id}` },
      { name: 'WORKFLOW_NAME', value: buildName },
    ];

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      manifest = {
        metadata: {
          labels: { ...buildLabels, 'tenlastic.com/role': 'Sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'tenlastic/node-development:latest',
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/workflow-status-sidecar/',
            },
          ],
          serviceAccountName: 'build-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: { ...buildLabels, 'tenlastic.com/role': 'Sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/workflow-status-sidecar:${version}`,
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '25m', memory: '50M' } },
            },
          ],
          serviceAccountName: 'build-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...buildLabels, 'tenlastic.com/role': 'Sidecar' },
        name,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...buildLabels, 'tenlastic.com/role': 'Sidecar' } },
        template: manifest,
      },
    });
  },
};
