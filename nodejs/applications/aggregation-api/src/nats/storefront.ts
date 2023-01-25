import { StorefrontModel } from '@tenlastic/mongoose';
import { log, NamespaceEvent, StorefrontEvent } from '@tenlastic/mongoose-nats';

// Delete Storefronts if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return StorefrontModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Log the message.
StorefrontEvent.sync(log);
