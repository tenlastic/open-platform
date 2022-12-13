import { WorkflowModel } from '@tenlastic/mongoose';
import { NamespaceEvent, WorkflowEvent } from '@tenlastic/mongoose-nats';

import { KubernetesWorkflow, KubernetesWorkflowSidecar } from '../kubernetes';

// Delete Workflows if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return WorkflowModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Create, delete, and update Kubernetes resources.
WorkflowEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesWorkflow.delete(payload.fullDocument, payload.operationType);
    await KubernetesWorkflowSidecar.delete(payload.fullDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesWorkflow.upsert(payload.fullDocument);
    await KubernetesWorkflowSidecar.upsert(payload.fullDocument);
  } else if (payload.operationType === 'update' && payload.fullDocument.status.finishedAt) {
    await KubernetesWorkflow.delete(payload.fullDocument);
    await KubernetesWorkflowSidecar.delete(payload.fullDocument);
  }
});
