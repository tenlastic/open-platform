import { helmReleaseApiV1, namespaceApiV1, networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument, NamespaceEvent } from '@tenlastic/mongoose-models';
import { mongoose, Ref } from '@typegoose/typegoose';

NamespaceEvent.sync(async payload => {
  if (payload.operationType === 'delete') {
    await KubernetesNamespace.delete(payload.fullDocument);
  } else {
    await KubernetesNamespace.upsert(payload.fullDocument);
  }
});

export const KubernetesNamespace = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * ========================
     * NAMESPACE
     * ========================
     */
    await namespaceApiV1.delete(name);
  },
  getName: (_id: string | mongoose.Types.ObjectId | Ref<NamespaceDocument>) => {
    return `namespace-${_id}`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * ========================
     * NAMESPACE
     * ========================
     */
    await namespaceApiV1.createOrReplace({ metadata: { name } });

    /**
     * ========================
     * ARGO WORKFLOW CONTROLLER
     * ========================
     */
    await helmReleaseApiV1.createOrReplace(name, {
      metadata: { name: 'argo' },
      spec: {
        chart: {
          name: 'argo',
          repository: 'https://argoproj.github.io/argo-helm',
          version: '0.15.2',
        },
        releaseName: `${name}-argo`,
        values: {
          controller: {
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
            containerRuntimeExecutor: 'k8sapi',
            parallelism: namespace.limits.workflows.parallelism,
            replicas: 1,
            resources: {
              requests: {
                cpu: '50m',
              },
            },
          },
          installCRD: false,
          server: {
            enabled: false,
          },
          singleNamespace: true,
        },
      },
    });

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace(name, {
      metadata: { name },
      spec: {
        egress: [
          {
            ports: [
              // Allow DNS resolution.
              { port: 53 as any, protocol: 'TCP' },
              { port: 53 as any, protocol: 'UDP' },
            ],
            to: [
              {
                // Allow traffic to the Web Socket Server.
                namespaceSelector: { matchLabels: { name: 'kube-system' } },
                podSelector: { matchLabels: { 'k8s-app': 'kube-dns' } },
              },
            ],
          },
          {
            to: [
              {
                // Block internal traffic.
                ipBlock: {
                  cidr: '0.0.0.0/0',
                  except: ['10.0.0.0/8', '172.0.0.0/8', '192.0.0.0/8'],
                },
              },
              {
                // Allow traffic to the API.
                namespaceSelector: { matchLabels: { name: 'default' } },
                podSelector: { matchLabels: { app: 'api' } },
              },
              {
                // Allow traffic to the Web Socket Server.
                namespaceSelector: { matchLabels: { name: 'default' } },
                podSelector: { matchLabels: { app: 'wss' } },
              },
            ],
          },
        ],
        podSelector: {},
        policyTypes: ['Egress'],
      },
    });
  },
};
