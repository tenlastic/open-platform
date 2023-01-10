import { WorkflowDocument } from '@tenlastic/mongoose';
import { DatabaseOperationType } from '@tenlastic/mongoose-nats';
import { KubernetesWorkflowApplication } from './application';

import { KubernetesWorkflowNetworkPolicy } from './network-policy';
import { KubernetesWorkflowSidecar } from './sidecar';

export const KubernetesWorkflow = {
  delete: async (workflow: WorkflowDocument, operationType?: DatabaseOperationType) => {
    await Promise.all([
      await KubernetesWorkflowApplication.delete(workflow, operationType),
      await KubernetesWorkflowNetworkPolicy.delete(workflow),
      await KubernetesWorkflowSidecar.delete(workflow),
    ]);
  },
  getLabels: (workflow: WorkflowDocument) => {
    const name = KubernetesWorkflow.getName(workflow);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/namespaceId': `${workflow.namespaceId}`,
      'tenlastic.com/workflowId': `${workflow._id}`,
    };
  },
  getName: (workflow: WorkflowDocument) => {
    return `workflow-${workflow._id}`;
  },
  upsert: async (workflow: WorkflowDocument) => {
    await Promise.all([
      await KubernetesWorkflowApplication.upsert(workflow),
      await KubernetesWorkflowNetworkPolicy.upsert(workflow),
      await KubernetesWorkflowSidecar.upsert(workflow),
    ]);
  },
};
