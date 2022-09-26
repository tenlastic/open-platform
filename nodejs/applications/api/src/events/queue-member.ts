import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { QueueMember, QueueMemberDocument } from '../mongodb';
import { GroupEvent } from './group';
import { QueueEvent } from './queue';
import { WebSocketEvent } from './web-socket';

export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMember when associated Group is deleted or updated.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'insert') {
    return;
  }

  const queueMembers = await QueueMember.find({ groupId: payload.fullDocument._id });
  return Promise.all(queueMembers.map((qm) => qm.remove()));
});

// Delete QueueMember when associated Queue is deleted.
QueueEvent.async(async (payload) => {
  if (payload.operationType !== 'delete') {
    return;
  }

  const queueMembers = await QueueMember.find({ queueId: payload.fullDocument._id });
  return Promise.all(queueMembers.map((qm) => qm.remove()));
});

// Delete QueueMember when associated WebSocket is deleted or disconnected.
WebSocketEvent.async(async (payload) => {
  if (
    payload.operationType === 'delete' ||
    payload.updateDescription?.updatedFields?.disconnectedAt
  ) {
    const queueMembers = await QueueMember.find({ webSocketId: payload.fullDocument._id });
    return Promise.all(queueMembers.map((qm) => qm.remove()));
  }
});
