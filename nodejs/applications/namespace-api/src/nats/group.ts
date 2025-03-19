import { GroupModel } from '@tenlastic/mongoose';
import { GroupEvent, log, NamespaceEvent, WebSocketEvent } from '@tenlastic/mongoose-nats';

// Log the message.
GroupEvent.sync(log);

// Delete the Group if empty.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  if (payload.fullDocument.members.length === 0) {
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

// Remove Group Member when associated Web Socket is deleted.
WebSocketEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return GroupModel.updateOne(
        { 'members.webSocketId': payload.fullDocument._id },
        { $pull: { members: { webSocketId: payload.fullDocument._id } } },
      );
  }
});
