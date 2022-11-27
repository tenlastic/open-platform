import {
  EventEmitter,
  IDatabasePayload,
  Storefront,
  StorefrontDocument,
} from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';

export const StorefrontEvent = new EventEmitter<IDatabasePayload<StorefrontDocument>>();

// Delete Storefronts if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Storefront.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
