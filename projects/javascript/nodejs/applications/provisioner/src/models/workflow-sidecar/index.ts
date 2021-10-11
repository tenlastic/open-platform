import {
  deploymentApiV1,
  secretApiV1,
  V1PodTemplateSpec,
  V1Probe,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import { Workflow, WorkflowDocument } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { subscribe } from '../../subscribe';
import { wait } from '../../wait';
import { KubernetesWorkflow } from '../workflow';

export const KubernetesWorkflowSidecar = {
  delete: async (build: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(build);

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
  getName(workflow: WorkflowDocument) {
    return `workflow-${workflow._id}-sidecar`;
  },
  subscribe: () => {
    return subscribe<WorkflowDocument>(Workflow, 'workflow-sidecar', async payload => {
      if (payload.operationType === 'insert') {
        console.log(`Upserting Workflow Sidecar: ${payload.fullDocument._id}.`);
        await KubernetesWorkflowSidecar.upsert(payload.fullDocument);
      } else if (payload.operationType === 'update' && payload.fullDocument.status?.finishedAt) {
        console.log(`Deleting Build Sidecar: ${payload.fullDocument._id}.`);
        await KubernetesWorkflowSidecar.delete(payload.fullDocument);
      }
    });
  },
  upsert: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);
    const workflowLabels = KubernetesWorkflow.getLabels(workflow);
    const workflowName = KubernetesWorkflow.getName(workflow);

    const uid = await wait(1000, 15 * 1000, async () => {
      const response = await workflowApiV1.read(KubernetesWorkflow.getName(workflow), 'dynamic');
      return response.body.metadata.uid;
    });
    const ownerReferences = [
      {
        apiVersion: 'argoproj.io/v1alpha1',
        controller: true,
        kind: 'Workflow',
        name: workflowName,
        uid,
      },
    ];

    /**
     * ======================
     * SECRET
     * ======================
     */
    const administrator = { roles: ['workflows'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
        name,
        ownerReferences,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        WORKFLOW_ENDPOINT: `http://api.static:3000/workflows/${workflow._id}`,
        WORKFLOW_NAME: workflowName,
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
                  key: workflow.preemptible
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
    const livenessProbe: V1Probe = {
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 30,
      periodSeconds: 30,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/projects/')) {
      manifest = {
        metadata: {
          labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:14',
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
          serviceAccountName: 'workflow-sidecar',
          volumes: [
            { name: 'node-modules', persistentVolumeClaim: { claimName: 'node-modules' } },
            { hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'source' },
          ],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
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
          serviceAccountName: 'workflow-sidecar',
        },
      };
    }

    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
        name,
        ownerReferences,
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
