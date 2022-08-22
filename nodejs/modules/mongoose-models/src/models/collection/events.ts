import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { Collection, CollectionDocument } from './model';

export const OnCollectionConsumed = new EventEmitter<IDatabasePayload<CollectionDocument>>();

// Delete Collections if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Collection.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
