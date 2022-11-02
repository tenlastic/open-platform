import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { Storefront, StorefrontDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const StorefrontEvent = new EventEmitter<IDatabasePayload<StorefrontDocument>>();

// Delete Storefronts if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Storefront.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete unused images and videos on update.
StorefrontEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return payload.fullDocument.removeMinioObjects();
  }
});
