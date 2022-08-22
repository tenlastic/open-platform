import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { Workflow, WorkflowDocument } from './model';

export const OnWorkflowConsumed = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

// Delete Workflows if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Workflow.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
