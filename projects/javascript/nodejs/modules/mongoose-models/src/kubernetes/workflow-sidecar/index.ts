import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { NamespaceDocument } from '../../models/namespace';
import { WorkflowDocument, WorkflowEvent } from '../../models/workflow';
import { KubernetesWorkflow } from '../workflow';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

WorkflowEvent.sync(async payload => {
  const workflow = payload.fullDocument;

  if (!workflow.populated('namespaceDocument')) {
    await workflow.populate('namespaceDocument').execPopulate();
  }

  if (payload.operationType === 'insert') {
    await KubernetesWorkflowSidecar.create(workflow.namespaceDocument, workflow);
  }
});

export const KubernetesWorkflowSidecar = {
  create: async (namespace: NamespaceDocument, workflow: WorkflowDocument) => {
    const name = KubernetesWorkflowSidecar.getName(workflow);
    const workflowName = KubernetesWorkflow.getName(workflow);

    const uid = await getWorkflowUid(namespace.kubernetesNamespace, workflow);
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
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(namespace.kubernetesNamespace, {
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
    await coreV1.createNamespacedServiceAccount(namespace.kubernetesNamespace, {
      metadata: { name, ownerReferences },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(namespace.kubernetesNamespace, {
      metadata: { name, ownerReferences },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name,
          namespace: namespace.kubernetesNamespace,
        },
      ],
    });

    /**
     * ======================
     * DEPLOYMENT
     * ======================
     */
    const administrator = { roles: ['workflows'], system: true };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: workflow.isPreemptible
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
    const env = [
      { name: 'ACCESS_TOKEN', value: accessToken },
      { name: 'LOG_CONTAINER', value: `main` },
      { name: 'LOG_ENDPOINT', value: `http://api.default:3000/workflows/${workflow._id}/logs` },
      { name: 'LOG_POD_LABEL_SELECTOR', value: `app=${workflowName},role=application` },
      { name: 'LOG_POD_NAMESPACE', value: namespace.kubernetesNamespace },
      { name: 'WORKFLOW_ENDPOINT', value: `http://api.default:3000/workflows/${workflow._id}` },
      { name: 'WORKFLOW_NAME', value: workflowName },
      { name: 'WORKFLOW_NAMESPACE', value: namespace.kubernetesNamespace },
    ];

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    // If application is running locally, create debug containers.
    // If application is running in production, create production containers.
    let manifest: k8s.V1PodTemplateSpec;
    if (process.env.PWD && process.env.PWD.includes('/usr/src/app/projects/')) {
      manifest = {
        metadata: {
          labels: {
            app: workflowName,
            role: 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir: '/usr/src/app/projects/javascript/nodejs/applications/log-sidecar/',
            },
            {
              command: ['npm', 'run', 'start'],
              env,
              image: 'node:12',
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
              volumeMounts: [{ mountPath: '/usr/src/app/', name: 'app' }],
              workingDir:
                '/usr/src/app/projects/javascript/nodejs/applications/workflow-status-sidecar/',
            },
          ],
          serviceAccountName: name,
          volumes: [{ hostPath: { path: '/run/desktop/mnt/host/c/open-platform/' }, name: 'app' }],
        },
      };
    } else {
      manifest = {
        metadata: {
          labels: {
            app: workflowName,
            role: 'sidecar',
          },
          name,
        },
        spec: {
          affinity,
          containers: [
            {
              env,
              image: `tenlastic/log-sidecar:${version}`,
              name: 'log-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
            {
              env,
              image: `tenlastic/workflow-status-sidecar:${version}`,
              name: 'workflow-status-sidecar',
              resources: { requests: { cpu: '50m', memory: '50M' } },
            },
          ],
          serviceAccountName: name,
        },
      };
    }

    await appsV1.createNamespacedDeployment(namespace.kubernetesNamespace, {
      metadata: {
        labels: {
          app: workflowName,
          role: 'sidecar',
        },
        name,
        ownerReferences,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: workflowName,
            role: 'sidecar',
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
    const response: any = await customObjects.getNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      namespace,
      'workflows',
      KubernetesWorkflow.getName(workflow),
    );

    return response.body.metadata.uid;
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getWorkflowUid(namespace, workflow);
  }
}
