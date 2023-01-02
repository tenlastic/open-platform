import { QueueMemberModel } from '@tenlastic/mongoose';
import { NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete QueueMembers if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
