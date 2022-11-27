import { EventEmitter, IDatabasePayload, Workflow, WorkflowDocument } from '@tenlastic/mongoose';

import { KubernetesWorkflow, KubernetesWorkflowSidecar } from '../kubernetes';
import { NamespaceEvent } from './namespace';

export const WorkflowEvent = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

// Delete Workflows if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Workflow.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Kubernetes resources.
WorkflowEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesWorkflow.delete(payload.fullDocument, payload.operationType);
    await KubernetesWorkflowSidecar.delete(payload.fullDocument);
  } else if (payload.operationType === 'insert') {
    await KubernetesWorkflow.upsert(payload.fullDocument);
    await KubernetesWorkflowSidecar.upsert(payload.fullDocument);
  } else if (payload.operationType === 'update' && payload.fullDocument.status?.finishedAt) {
    await KubernetesWorkflow.delete(payload.fullDocument);
    await KubernetesWorkflowSidecar.delete(payload.fullDocument);
  }
});
