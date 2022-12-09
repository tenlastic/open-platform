import { QueueMemberModel } from '@tenlastic/mongoose';
import { GroupEvent, MatchEvent, QueueEvent, WebSocketEvent } from '@tenlastic/mongoose-nats';

// Delete Queue Member when associated Group is deleted or its Users are updated.
GroupEvent.async(async (payload) => {
  if (
    payload.operationType === 'delete' ||
    (payload.operationType === 'update' && payload.updateDescription.updatedFields.userIds)
  ) {
    return QueueMemberModel.deleteMany({
      $or: [
        { groupId: payload.fullDocument._id },
        { userIds: { $in: payload.fullDocument.userIds } },
      ],
    });
  }
});

// Delete Queue Member when associated Match is created.
MatchEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'insert':
      return QueueMemberModel.deleteMany({ userIds: { $in: payload.fullDocument.userIds } });
  }
});

// Delete Queue Member when associated Queue is deleted.
QueueEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ queueId: payload.fullDocument._id });
  }
});

// Delete Queue Member when associated WebSocket is deleted.
WebSocketEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ webSocketId: payload.fullDocument._id });
  }
});
