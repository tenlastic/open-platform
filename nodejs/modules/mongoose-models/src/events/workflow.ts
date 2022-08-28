import { EventEmitter, IDatabasePayload } from '../change-stream';
import { Workflow, WorkflowDocument } from '../models';
import { NamespaceEvent } from './namespace';

export const WorkflowEvent = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

// Delete Workflows if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Workflow.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
