import { Workflow, WorkflowDocument } from '@tenlastic/mongoose-models';

import { subscribe } from '../subscribe';
import { KubernetesWorkflow, KubernetesWorkflowSidecar } from '../models';

export function workflows() {
  return subscribe<WorkflowDocument>(Workflow, 'workflow', async (payload) => {
    if (payload.operationType === 'delete') {
      console.log(`Deleting Workflow: ${payload.fullDocument._id}.`);
      await KubernetesWorkflow.delete(payload.fullDocument, payload.operationType);

      console.log(`Deleting Build Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesWorkflowSidecar.delete(payload.fullDocument);
    } else if (payload.operationType === 'insert') {
      console.log(`Creating Workflow: ${payload.fullDocument._id}.`);
      await KubernetesWorkflow.upsert(payload.fullDocument);

      console.log(`Upserting Workflow Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesWorkflowSidecar.upsert(payload.fullDocument);
    } else if (payload.operationType === 'update' && payload.fullDocument.status?.finishedAt) {
      console.log(`Deleting Build Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesWorkflowSidecar.delete(payload.fullDocument);
    }
  });
}
