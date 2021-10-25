import {
  deploymentApiV1,
  secretApiV1,
  V1PodTemplateSpec,
  V1Probe,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import { Build, BuildDocument, Namespace, NamespaceRole } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { subscribe } from '../../subscribe';
import { wait } from '../../wait';
import { KubernetesBuild } from '../build';

export const KubernetesBuildSidecar = {
  delete: async (build: BuildDocument) => {
    const name = KubernetesBuildSidecar.getName(build);

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete('dynamic', name);

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete('dynamic', name);
  },
  getName: (build: BuildDocument) => {
    return `build-${build._id}-sidecar`;
  },
  subscribe: () => {
    return subscribe<BuildDocument>(Build, 'build-sidecar', async payload => {
      if (payload.operationType === 'insert') {
        console.log(`Creating Build Sidecar: ${payload.fullDocument._id}.`);
        await KubernetesBuildSidecar.upsert(payload.fullDocument);
      } else if (payload.operationType === 'update' && payload.fullDocument.status?.finishedAt) {
        console.log(`Deleting Build Sidecar: ${payload.fullDocument._id}.`);
        await KubernetesBuildSidecar.delete(payload.fullDocument);
      }
    });
  },
  upsert: async (build: BuildDocument) => {
    const buildLabels = KubernetesBuild.getLabels(build);
    const buildName = KubernetesBuild.getName(build);
    const name = KubernetesBuildSidecar.getName(build);

    const uid = await wait(1000, 15 * 1000, async () => {
      const response = await workflowApiV1.read(KubernetesBuild.getName(build), 'dynamic');
      return response.body.metadata.uid;
    });
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
     * SECRET
     * ======================
     */
    const accessToken = Namespace.getAccessToken(build.namespaceId, [NamespaceRole.Builds]);
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...buildLabels, 'tenlastic.com/role': 'sidecar' },
        name,
        ownerReferences,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        WORKFLOW_ENDPOINT: `http://api.static:3000/builds/${build._id}`,
        WORKFLOW_NAME: buildName,
      },
    });

    /**
     * ======================
     * DEPLOYMENT
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
    const livenessProbe: V1Probe = {
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };
    const { version } = require('../../../package.json');

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/projects/')) {
      manifest = {
        metadata: {
          labels: { ...buildLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:14',
              livenessProbe,
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [
                {
                  mountPath: '/usr/src/projects/javascript/node_modules/',
                  name: 'node-modules',
                },
                { mountPath: '/usr/src/', name: 'source' },
              ],
              workingDir: '/usr/src/projects/javascript/nodejs/applications/workflow-sidecar/',
            },
          ],
          serviceAccountName: 'build-sidecar',
          volumes: [
            { name: 'node-modules', persistentVolumeClaim: { claimName: 'node-modules' } },
            { hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'source' },
          ],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: { ...buildLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              envFrom: [{ secretRef: { name } }],
              image: `tenlastic/workflow-sidecar:${version}`,
              livenessProbe,
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
          ],
          serviceAccountName: 'build-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...buildLabels, 'tenlastic.com/role': 'sidecar' },
        name,
        ownerReferences,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...buildLabels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
