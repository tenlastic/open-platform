import { mongoose, Ref } from '@hasezoey/typegoose';
import { NamespaceDocument, NamespaceEvent } from '@tenlastic/mongoose-models';

import { helmReleaseApiV1, namespaceApiV1 } from '../apis';

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
      metadata: {
        annotations: { 'fluxcd.io/automated': 'true' },
        name: 'argo',
      },
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
  },
};
