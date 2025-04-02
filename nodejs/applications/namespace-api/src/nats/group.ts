import { GroupModel } from '@tenlastic/mongoose';
import { GroupEvent, log, NamespaceEvent, WebSocketEvent } from '@tenlastic/mongoose-nats';

// Log the message.
GroupEvent.sync(log);

// Delete the Group if empty.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  if (payload.fullDocument.userIds.length === 0) {
    return GroupModel.deleteOne({ _id: payload.fullDocument._id });
  }
});

// Delete Groups if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return GroupModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
