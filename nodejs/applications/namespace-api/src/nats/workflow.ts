import { WorkflowModel } from '@tenlastic/mongoose';
import { log, NamespaceEvent, WorkflowEvent } from '@tenlastic/mongoose-nats';

import { KubernetesWorkflow } from '../kubernetes';

// Delete Workflows if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return WorkflowModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Log the message.
WorkflowEvent.sync(log);

// Create, delete, and update Kubernetes resources.
WorkflowEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesWorkflow.delete(payload.fullDocument, payload.operationType);
  } else if (payload.operationType === 'insert') {
    await KubernetesWorkflow.upsert(payload.fullDocument);
  } else if (payload.operationType === 'update' && payload.fullDocument.status.finishedAt) {
    await KubernetesWorkflow.delete(payload.fullDocument);
  }
});
