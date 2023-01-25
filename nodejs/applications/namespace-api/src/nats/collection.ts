import { CollectionModel } from '@tenlastic/mongoose';
import { CollectionEvent, log, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Log the message.
CollectionEvent.sync(log);

// Delete Collections if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return CollectionModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
