import {
  deploymentApiV1,
  secretApiV1,
  V1PodTemplateSpec,
  V1Probe,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import { Build, BuildDocument } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { subscribe } from '../../subscribe';
import { KubernetesBuild } from '../build';

export const KubernetesBuildSidecar = {
  getName: (build: BuildDocument) => {
    return `build-${build._id}-sidecar`;
  },
  subscribe: () => {
    return subscribe<BuildDocument>(Build, 'build-sidecar', async payload => {
      if (payload.operationType === 'insert') {
        await KubernetesBuildSidecar.upsert(payload.fullDocument);
      }
    });
  },
  upsert: async (build: BuildDocument) => {
    const buildLabels = KubernetesBuild.getLabels(build);
    const buildName = KubernetesBuild.getName(build);
    const name = KubernetesBuildSidecar.getName(build);

    const uid = await getBuildUid(build);
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
    const administrator = { roles: ['builds'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...buildLabels, 'tenlastic.com/role': 'sidecar' },
        name,
        ownerReferences,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        LOG_CONTAINER: 'main',
        LOG_ENDPOINT: `http://api.static:3000/builds/${build._id}/logs`,
        LOG_POD_LABEL_SELECTOR: `tenlastic.com/app=${buildName},tenlastic.com/role=application`,
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

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

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
              image: 'node:12',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 300 },
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

async function getBuildUid(build: BuildDocument): Promise<string> {
  try {
    const response = await workflowApiV1.read(KubernetesBuild.getName(build), 'dynamic');
    return response.body.metadata.uid;
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getBuildUid(build);
  }
}
