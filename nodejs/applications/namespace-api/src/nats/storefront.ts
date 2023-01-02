import { StorefrontModel } from '@tenlastic/mongoose';
import { NamespaceEvent, StorefrontEvent } from '@tenlastic/mongoose-nats';

import { MinioStorefront } from '../minio';

// Delete Storefronts if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return StorefrontModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete unused images and videos on update.
StorefrontEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MinioStorefront.removeObject(payload.fullDocument);
  }
});
