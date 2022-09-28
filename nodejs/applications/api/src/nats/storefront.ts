import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { Storefront, StorefrontDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const StorefrontEvent = new EventEmitter<IDatabasePayload<StorefrontDocument>>();

// Delete Storefronts if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Storefront.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete unused images and videos on update.
StorefrontEvent.async(async (payload) => {
  const storefront = payload.fullDocument;

  switch (payload.operationType) {
    case 'delete':
      return storefront.removeMinioObjects();

    case 'update':
      return Promise.all([storefront.removeMinioImages(), storefront.removeMinioVideos()]);
  }
});
