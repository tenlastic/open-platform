import { V1PodTemplateSpec, V1Probe } from '@kubernetes/client-node';
import { deploymentApiV1, secretApiV1 } from '@tenlastic/kubernetes';
import {
  Authorization,
  AuthorizationDocument,
  AuthorizationRole,
  WorkflowDocument,
} from '@tenlastic/mongoose-models';
import * as Chance from 'chance';

import { KubernetesNamespace } from '../namespace';
import { KubernetesWorkflow } from '../workflow';

const chance = new Chance();

export const KubernetesWorkflowSidecar = {
  delete: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    const authorization = await Authorization.findOne({ name, namespaceId: workflow.namespaceId });
    if (authorization) {
      await authorization.remove();
    }

    /**
     * ======================
     * SECRET
     * ======================
     */
    await secretApiV1.delete(name, 'dynamic');

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName(workflow: WorkflowDocument) {
    return `workflow-${workflow._id}-sidecar`;
  },
  upsert: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);
    const namespaceName = KubernetesNamespace.getName(workflow.namespaceId);
    const workflowLabels = KubernetesWorkflow.getLabels(workflow);
    const workflowName = KubernetesWorkflow.getName(workflow);

    /**
     * =======================
     * AUTHORIZATION
     * =======================
     */
    let authorization: AuthorizationDocument;
    try {
      authorization = await Authorization.create({
        apiKey: chance.hash({ length: 64 }),
        name,
        namespaceId: workflow.namespaceId,
        roles: [AuthorizationRole.WorkflowsReadWrite],
        system: true,
      });
    } catch (e) {
      if (e.name !== 'UniqueError') {
        throw e;
      }

      authorization = await Authorization.findOne({ name, namespaceId: workflow.namespaceId });
    }

    /**
     * ======================
     * SECRET
     * ======================
     */
    const { _id, namespaceId } = workflow;
    const host = `${namespaceName}-api.dynamic:3000`;
    await secretApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' },
        name,
      },
      stringData: {
        API_KEY: authorization.apiKey,
        WORKFLOW_ENDPOINT: `http://${host}/namespaces/${namespaceId}/workflows/${_id}`,
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
      failureThreshold: 3,
      httpGet: { path: `/`, port: 3000 as any },
      initialDelaySeconds: 10,
      periodSeconds: 10,
    };

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
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
              image: 'tenlastic/node-development:latest',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 30, periodSeconds: 15 },
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
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
              resources: { requests: { cpu: '25m', memory: '50Mi' } },
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
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...workflowLabels, 'tenlastic.com/role': 'sidecar' } },
        template: manifest,
      },
    });
  },
};
