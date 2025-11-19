import { StorefrontModel } from '@tenlastic/mongoose';
import { log, NamespaceEvent, StorefrontEvent } from '@tenlastic/mongoose-nats';

import { MinioStorefront } from '../minio';

// Delete Storefronts if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await StorefrontModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Log the message.
StorefrontEvent.sync(log);

// Delete unused images and videos on update.
StorefrontEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await MinioStorefront.removeObject(payload.fullDocument);
  }
});
