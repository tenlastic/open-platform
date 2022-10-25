import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { Collection, CollectionDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const CollectionEvent = new EventEmitter<IDatabasePayload<CollectionDocument>>();

// Delete Collections if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Collection.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
