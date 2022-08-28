import { EventEmitter, IDatabasePayload } from '../change-stream';
import { Collection, CollectionDocument } from '../models';
import { NamespaceEvent } from './namespace';

export const CollectionEvent = new EventEmitter<IDatabasePayload<CollectionDocument>>();

// Delete Collections if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Collection.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
