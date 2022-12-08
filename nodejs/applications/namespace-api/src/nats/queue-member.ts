import {
  EventEmitter,
  IDatabasePayload,
  QueueMemberDocument,
  QueueMemberModel,
} from '@tenlastic/mongoose';

import { GroupEvent } from './group';
import { MatchEvent } from './match';
import { QueueEvent } from './queue';
import { WebSocketEvent } from './web-socket';

export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMember when associated Group is deleted or updated.
GroupEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
    case 'update':
      return QueueMemberModel.deleteMany({ groupId: payload.fullDocument._id });
  }
});

// Delete QueueMember when associated Match is created.
MatchEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ userIds: { $in: payload.fullDocument.userIds } });
  }
});

// Delete QueueMember when associated Queue is deleted.
QueueEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ queueId: payload.fullDocument._id });
  }
});

// Delete QueueMember when associated WebSocket is deleted.
WebSocketEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ webSocketId: payload.fullDocument._id });
  }
});
