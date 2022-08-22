import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { Queue, QueueDocument } from './model';

export const OnQueueConsumed = new EventEmitter<IDatabasePayload<QueueDocument>>();

// Delete Queues if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Queue.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
