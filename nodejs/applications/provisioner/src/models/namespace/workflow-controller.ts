import { configMapApiV1, deploymentApiV1, persistentVolumeClaimApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose-models';

import { KubernetesNamespace } from './';

export const KubernetesWorkflowController = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesWorkflowController.getName(namespace);

    /**
     * ========================
     * CONFIG MAP
     * ========================
     */
    await configMapApiV1.delete(name, 'dynamic');

    /**
     * ========================
     * DEPLOYMENT
     * ========================
     */
    await deploymentApiV1.delete(name, 'dynamic');
  },
  getName: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);
    return `${name}-workflow-controller`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesWorkflowController.getName(namespace);

    /**
     * ========================
     * CONFIG MAP
     * ========================
     */
    const configMap = [
      'containerRuntimeExecutor: k8sapi',
      `instanceID: ${name}`,
      `parallelism: 10`,
    ];
    await configMapApiV1.createOrReplace('dynamic', {
      data: { config: configMap.join('\n') },
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'workflow-controller' }, name },
    });

    /**
     * ========================
     * DEPLOYMENT
     * ========================
     */
    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels, 'tenlastic.com/role': 'workflow-controller' }, name },
      spec: {
        replicas: 1,
        selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'workflow-controller' } },
        template: {
          metadata: { labels: { ...labels, 'tenlastic.com/role': 'workflow-controller' } },
          spec: {
            affinity: {
              nodeAffinity: {
                requiredDuringSchedulingIgnoredDuringExecution: {
                  nodeSelectorTerms: [
                    {
                      matchExpressions: [{ key: 'tenlastic.com/low-priority', operator: 'Exists' }],
                    },
                  ],
                },
              },
            },
            containers: [
              {
                args: [
                  '--configmap',
                  name,
                  '--executor-image',
                  'quay.io/argoproj/argoexec:v3.3.6',
                  '--loglevel',
                  'info',
                  '--gloglevel',
                  '0',
                  '--namespaced',
                ],
                command: ['workflow-controller'],
                env: [
                  {
                    name: 'ARGO_NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath: 'metadata.namespace',
                      },
                    },
                  },
                  { name: 'LEADER_ELECTION_DISABLE', value: 'true' },
                ],
                image: 'quay.io/argoproj/workflow-controller:v3.3.6',
                livenessProbe: {
                  httpGet: { path: '/metrics', port: 'metrics' as any },
                  initialDelaySeconds: 30,
                  periodSeconds: 30,
                },
                name: 'controller',
                ports: [{ name: 'metrics', containerPort: 9090 }],
                resources: { requests: { cpu: '50m' } },
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities: { drop: ['ALL'] },
                  readOnlyRootFilesystem: true,
                  runAsNonRoot: true,
                },
              },
            ],
            serviceAccountName: 'argo',
          },
        },
      },
    });
  },
};
