import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { QueueMember, QueueMemberDocument } from '../mongodb';
import { GroupEvent } from './group';
import { QueueEvent } from './queue';
import { WebSocketEvent } from './web-socket';

export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMember when associated Group is deleted or updated.
GroupEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
    case 'update':
      return QueueMember.deleteMany({ groupId: payload.fullDocument._id });
  }
});

// Delete QueueMember when associated Queue is deleted.
QueueEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMember.deleteMany({ queueId: payload.fullDocument._id });
  }
});

// Delete QueueMember when associated WebSocket is deleted.
WebSocketEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMember.deleteMany({ webSocketId: payload.fullDocument._id });
  }
});
