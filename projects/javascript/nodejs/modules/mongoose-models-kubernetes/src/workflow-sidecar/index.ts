import {
  deploymentApiV1,
  roleStackApiV1,
  secretApiV1,
  V1PodTemplateSpec,
  V1Probe,
  workflowApiV1,
} from '@tenlastic/kubernetes';
import { WorkflowDocument, WorkflowEvent } from '@tenlastic/mongoose-models';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { KubernetesNamespace } from '../namespace';
import { KubernetesWorkflow } from '../workflow';

WorkflowEvent.sync(async payload => {
  if (payload.operationType === 'insert' || payload.operationType === 'update') {
    await KubernetesWorkflowSidecar.upsert(payload.fullDocument);
  }
});

export const KubernetesWorkflowSidecar = {
  upsert: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);
    const namespace = KubernetesNamespace.getName(workflow.namespaceId);
    const workflowName = KubernetesWorkflow.getName(workflow);

    const uid = await getWorkflowUid(namespace, workflow);
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
     * ROLE STACK
     * ======================
     */
    await roleStackApiV1.createOrReplace(namespace, {
      metadata: { name, ownerReferences },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods', 'pods/log', 'pods/status'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: ['argoproj.io'],
          resources: ['workflows'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });

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
    await secretApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': workflowName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
        ownerReferences,
      },
      stringData: {
        ACCESS_TOKEN: accessToken,
        LOG_CONTAINER: `main`,
        LOG_ENDPOINT: `http://api.default:3000/workflows/${workflow._id}/logs`,
        LOG_POD_LABEL_SELECTOR: `tenlastic.com/app=${workflowName},tenlastic.com/role=application`,
        LOG_POD_NAMESPACE: namespace,
        WORKFLOW_ENDPOINT: `http://api.default:3000/workflows/${workflow._id}`,
        WORKFLOW_NAME: workflowName,
        WORKFLOW_NAMESPACE: namespace,
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
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            'tenlastic.com/app': workflowName,
            'tenlastic.com/role': 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              envFrom: [{ secretRef: { name } }],
              image: 'node:12',
              livenessProbe: { ...livenessProbe, initialDelaySeconds: 120 },
              name: 'workflow-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/workflow-sidecar/',
            },
          ],
          serviceAccountName: name,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      const packageDotJson = fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8');
      const version = JSON.parse(packageDotJson).version;

      manifest = {
        metadata: {
          labels: {
            'tenlastic.com/app': workflowName,
            'tenlastic.com/role': 'sidecar',
          },
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
          serviceAccountName: name,
        },
      };
    }

    await deploymentApiV1.createOrReplace(namespace, {
      metadata: {
        labels: {
          'tenlastic.com/app': workflowName,
          'tenlastic.com/role': 'sidecar',
        },
        name,
        ownerReferences,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            'tenlastic.com/app': workflowName,
            'tenlastic.com/role': 'sidecar',
          },
        },
        template: manifest,
      },
    });
  },
  getName(workflow: WorkflowDocument) {
    return `workflow-${workflow._id}-sidecar`;
  },
};

async function getWorkflowUid(namespace: string, workflow: WorkflowDocument): Promise<string> {
  try {
    const response = await workflowApiV1.read(KubernetesWorkflow.getName(workflow), namespace);
    return response.body.metadata.uid;
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getWorkflowUid(namespace, workflow);
  }
}
