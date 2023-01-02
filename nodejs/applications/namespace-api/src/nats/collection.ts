import { CollectionModel } from '@tenlastic/mongoose';
import { NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Collections if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return CollectionModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
