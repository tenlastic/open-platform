import { networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose-models';
import { mongoose } from '@typegoose/typegoose';

import { KubernetesApi } from './api';
import { KubernetesMinio } from './minio';
import { KubernetesMongodb } from './mongodb';
import { KubernetesNats } from './nats';
import { KubernetesProvisioner } from './provisioner';
import { KubernetesSidecar } from './sidecar';
import { KubernetesWorkflowController } from './workflow-controller';
import { KubernetesWss } from './wss';

export const KubernetesNamespace = {
  delete: async (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * ========================
     * INFRASTRUCTURE
     * ========================
     */
    await KubernetesMinio.delete(namespace);
    await KubernetesMongodb.delete(namespace);
    await KubernetesNats.delete(namespace);
    await KubernetesWorkflowController.delete(namespace);

    /**
     * ========================
     * APPLICATIONS
     * ========================
     */
    await KubernetesApi.delete(namespace);
    await KubernetesProvisioner.delete(namespace);
    await KubernetesSidecar.delete(namespace);
    await KubernetesWss.delete(namespace);
  },
  getAffinity: (namespace: NamespaceDocument, preemptible: boolean, role: string) => {
    const name = KubernetesNamespace.getName(namespace._id);

    return {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: preemptible ? 'tenlastic.com/low-priority' : 'tenlastic.com/high-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
      podAntiAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              labelSelector: {
                matchExpressions: [
                  { key: 'tenlastic.com/app', operator: 'In', values: [name] },
                  { key: 'tenlastic.com/role', operator: 'In', values: [role] },
                ],
              },
              topologyKey: 'kubernetes.io/hostname',
            },
            weight: 1,
          },
        ],
      },
    };
  },
  getLabels: (namespace: NamespaceDocument) => {
    const name = KubernetesNamespace.getName(namespace._id);
    return { 'tenlastic.com/app': name, 'tenlastic.com/namespaceId': `${namespace._id}` };
  },
  getName: (_id: string | mongoose.Types.ObjectId) => {
    return `namespace-${_id}`;
  },
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * ========================
     * INFRASTRUCTURE
     * ========================
     */
    await KubernetesMinio.upsert(namespace);
    await KubernetesMongodb.upsert(namespace);
    await KubernetesNats.upsert(namespace);
    await KubernetesWorkflowController.upsert(namespace);

    /**
     * ========================
     * APPLICATIONS
     * ========================
     */
    await KubernetesApi.upsert(namespace);
    await KubernetesProvisioner.upsert(namespace);
    await KubernetesSidecar.upsert(namespace);
    await KubernetesWss.upsert(namespace);
  },
};
