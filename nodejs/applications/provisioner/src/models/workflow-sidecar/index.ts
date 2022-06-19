import {
  deploymentApiV1,
  secretApiV1,
  V1PodTemplateSpec,
  V1Probe,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import { Namespace, NamespaceRole, WorkflowDocument } from '@tenlastic/mongoose-models';

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
    const accessToken = Namespace.getAccessToken(workflow.namespaceId, [NamespaceRole.Workflows]);
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
                  key: 'tenlastic.com/high-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
    };
    const livenessProbe: V1Probe = {
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
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
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
              workingDir: '/usr/src/nodejs/applications/workflow-sidecar/',
            },
          ],
          serviceAccountName: 'workflow-sidecar',
          volumes: [
            { hostPath: { path: '/run/desktop/mnt/host/wsl/open-platform/' }, name: 'workspace' },
          ],
        },
      };
    } else {
      const { version } = require('../../../package.json');

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
