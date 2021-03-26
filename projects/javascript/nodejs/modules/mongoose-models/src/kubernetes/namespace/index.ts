import * as k8s from '@kubernetes/client-node';

import { NamespaceDocument, NamespaceEvent } from '../../models/namespace';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);

NamespaceEvent.sync(async payload => {
  const namespace = payload.fullDocument;

  if (payload.operationType === 'delete') {
    await KubernetesNamespace.delete(namespace);
  } else if (payload.operationType === 'insert') {
    await KubernetesNamespace.create(namespace);
  }
});

export const KubernetesNamespace = {
  create: async (namespace: NamespaceDocument) => {
    /**
     * ========================
     * NAMESPACE
     * ========================
     */
    await coreV1.createNamespace({ metadata: { name: namespace.kubernetesNamespace } });

    /**
     * ========================
     * ARGO WORKFLOW CONTROLLER
     * ========================
     */
    await customObjects.createNamespacedCustomObject(
      'helm.fluxcd.io',
      'v1',
      namespace.kubernetesNamespace,
      'helmreleases',
      {
        apiVersion: 'helm.fluxcd.io/v1',
        kind: 'HelmRelease',
        metadata: {
          annotations: {
            'fluxcd.io/automated': 'true',
          },
          name: 'argo',
          namespace: namespace.kubernetesNamespace,
        },
        spec: {
          chart: {
            name: 'argo',
            repository: 'https://argoproj.github.io/argo-helm',
            version: '0.15.2',
          },
          releaseName: `${namespace.kubernetesNamespace}-argo`,
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
      },
    );
  },
  delete: async (namespace: NamespaceDocument) => {
    try {
      await coreV1.deleteNamespace(namespace.kubernetesNamespace);
    } catch {}
  },
};
