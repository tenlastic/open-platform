import { StorefrontModel } from '@tenlastic/mongoose';
import { log, NamespaceEvent, StorefrontEvent } from '@tenlastic/mongoose-nats';

// Delete Storefronts if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await StorefrontModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Log the message.
StorefrontEvent.sync(log);
