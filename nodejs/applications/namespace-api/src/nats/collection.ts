import {
  CollectionDocument,
  CollectionModel,
  EventEmitter,
  IDatabasePayload,
} from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';

export const CollectionEvent = new EventEmitter<IDatabasePayload<CollectionDocument>>();

// Delete Collections if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return CollectionModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
