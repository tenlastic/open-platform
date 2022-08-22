import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { Storefront, StorefrontDocument } from './model';

export const OnStorefrontConsumed = new EventEmitter<IDatabasePayload<StorefrontDocument>>();

// Delete Storefronts if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Storefront.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete unused images and videos on update.
OnStorefrontConsumed.async(async (payload) => {
  const storefront = payload.fullDocument;

  switch (payload.operationType) {
    case 'delete':
      return storefront.removeMinioObjects();

    case 'update':
      return Promise.all([storefront.removeMinioImages(), storefront.removeMinioVideos()]);
  }
});
