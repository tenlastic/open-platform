import { networkPolicyApiV1 } from '@tenlastic/kubernetes';
import { WorkflowDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from '../namespace';
import { KubernetesWorkflow } from './';

export const KubernetesWorkflowNetworkPolicy = {
  delete: async (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);

    await networkPolicyApiV1.delete(name, 'dynamic');
  },
  upsert: async (workflow: WorkflowDocument) => {
    const labels = KubernetesWorkflow.getLabels(workflow);
    const name = KubernetesWorkflow.getName(workflow);
    const namespaceName = KubernetesNamespace.getName(workflow.namespaceId);

    return networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: { labels: { ...labels }, name },
      spec: {
        egress: [
          {
            to: [
              { podSelector: { matchLabels: { 'tenlastic.com/app': namespaceName } } },
              { podSelector: { matchLabels: { 'tenlastic.com/app': name } } },
            ],
          },
        ],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });
  },
};
