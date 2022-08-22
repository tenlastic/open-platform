import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnGroupConsumed } from '../group';
import { OnQueueConsumed } from '../queue';
import { OnWebSocketConsumed } from '../web-socket';
import { QueueMember, QueueMemberDocument } from './model';

export const OnQueueMemberConsumed = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMember when associated Group is deleted or updated.
OnGroupConsumed.async(async (payload) => {
  if (payload.operationType === 'insert') {
    return;
  }

  const queueMembers = await QueueMember.find({ groupId: payload.fullDocument._id });
  return Promise.all(queueMembers.map((qm) => qm.remove()));
});

// Delete QueueMember when associated Queue is deleted.
OnQueueConsumed.async(async (payload) => {
  if (payload.operationType !== 'delete') {
    return;
  }

  const queueMembers = await QueueMember.find({ queueId: payload.fullDocument._id });
  return Promise.all(queueMembers.map((qm) => qm.remove()));
});

// Delete QueueMember when associated WebSocket is deleted or disconnected.
OnWebSocketConsumed.async(async (payload) => {
  if (
    payload.operationType === 'delete' ||
    payload.updateDescription?.updatedFields?.disconnectedAt
  ) {
    const queueMembers = await QueueMember.find({ webSocketId: payload.fullDocument._id });
    return Promise.all(queueMembers.map((qm) => qm.remove()));
  }
});
