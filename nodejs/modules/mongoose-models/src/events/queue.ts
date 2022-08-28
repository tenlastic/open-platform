import { EventEmitter, IDatabasePayload } from '../change-stream';
import { Queue, QueueDocument } from '../models';
import { NamespaceEvent } from './namespace';

export const QueueEvent = new EventEmitter<IDatabasePayload<QueueDocument>>();

// Delete Queues if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Queue.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
