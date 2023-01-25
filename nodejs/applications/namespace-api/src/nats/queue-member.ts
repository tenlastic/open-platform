import { QueueMemberModel } from '@tenlastic/mongoose';
import {
  GroupEvent,
  log,
  MatchEvent,
  NamespaceEvent,
  QueueEvent,
  QueueMemberEvent,
  WebSocketEvent,
} from '@tenlastic/mongoose-nats';

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

// Delete Queue Members when Match is started.
// Set MatchedAt on Queue Members when Match is created, but not started.
// Unset MatchedAt from Queue Members when Match is deleted.
MatchEvent.async(async (payload) => {
  if (
    (payload.operationType === 'insert' && payload.fullDocument.startedAt) ||
    (payload.operationType === 'update' && payload.updateDescription.updatedFields.startedAt)
  ) {
    return QueueMemberModel.deleteMany({ userIds: { $in: payload.fullDocument.userIds } });
  } else if (payload.operationType === 'insert' && !payload.fullDocument.startedAt) {
    return QueueMemberModel.updateMany(
      { userIds: { $in: payload.fullDocument.userIds } },
      { matchedAt: new Date() },
    );
  } else if (payload.operationType === 'delete') {
    return QueueMemberModel.updateMany(
      { userIds: { $in: payload.fullDocument.userIds } },
      { $unset: { matchedAt: 1 } },
    );
  }
});

// Delete Queue Members if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Queue Member when associated Queue is deleted.
QueueEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ queueId: payload.fullDocument._id });
  }
});

// Log the message.
QueueMemberEvent.sync(log);

// Delete Queue Member when associated WebSocket is deleted.
WebSocketEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ webSocketId: payload.fullDocument._id });
  }
});
