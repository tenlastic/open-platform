import { configMapApiV1, deploymentApiV1 } from '@tenlastic/kubernetes';
import { Namespace, NamespaceDocument } from '@tenlastic/mongoose-models';
import { mongoose, Ref } from '@typegoose/typegoose';

import { subscribe } from '../../subscribe';

export const KubernetesNamespace = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * ========================
     * ARGO WORKFLOW CONTROLLER
     * ========================
     */
    await configMapApiV1.delete(`${name}-argo-workflow-controller`, 'dynamic');
    await deploymentApiV1.delete(`${name}-argo-workflow-controller`, 'dynamic');
  },
  getName: (_id: string | mongoose.Types.ObjectId | Ref<NamespaceDocument>) => {
    return `namespace-${_id}`;
  },
  subscribe: () => {
    return subscribe<NamespaceDocument>(Namespace, 'namespace', async payload => {
      if (payload.operationType === 'delete') {
        await KubernetesNamespace.delete(payload.fullDocument);
      } else {
        await KubernetesNamespace.upsert(payload.fullDocument);
      }
    });
  },
  upsert: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * ========================
     * ARGO WORKFLOW CONTROLLER
     * ========================
     */
    const configMap = [
      'containerRuntimeExecutor: k8sapi',
      `instanceID: ${name}`,
      `parallelism: ${namespace.limits.workflows.count}`,
    ];
    await configMapApiV1.createOrReplace('dynamic', {
      data: { config: configMap.join('\n') },
      metadata: {
        labels: {
          'tenlastic.com/app': `${name}-argo-workflow-controller`,
          'tenlastic.com/namespaceId': `${namespace._id}`,
        },
        name: `${name}-argo-workflow-controller`,
      },
    });
    await deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: {
          'tenlastic.com/app': `${name}-argo-workflow-controller`,
          'tenlastic.com/namespaceId': `${namespace._id}`,
        },
        name: `${name}-argo-workflow-controller`,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            'tenlastic.com/app': `${name}-argo-workflow-controller`,
            'tenlastic.com/namespaceId': `${namespace._id}`,
          },
        },
        template: {
          metadata: {
            labels: {
              'tenlastic.com/app': `${name}-argo-workflow-controller`,
              'tenlastic.com/namespaceId': `${namespace._id}`,
            },
          },
          spec: {
            affinity: {
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
            },
            containers: [
              {
                args: [
                  '--configmap',
                  `${name}-argo-workflow-controller`,
                  '--executor-image',
                  'quay.io/argoproj/argoexec:v3.0.7',
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
                image: 'quay.io/argoproj/workflow-controller:v3.0.7',
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
