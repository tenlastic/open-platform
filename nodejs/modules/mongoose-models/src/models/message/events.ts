import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnGroupConsumed } from '../group';
import { OnUserConsumed } from '../user';
import { Message, MessageDocument } from './model';

export const OnMessageConsumed = new EventEmitter<IDatabasePayload<MessageDocument>>();

// Delete Messages if associated Group is deleted.
OnGroupConsumed.async(async (payload) => {
  const group = payload.fullDocument;

  if (payload.operationType === 'delete') {
    const records = await Message.find({ groupId: group._id });
    const promises = records.map((r) => r.remove());
    return Promise.all(promises);
  } else if (payload.operationType === 'update') {
    const records = await Message.find({ fromUserId: { $nin: group.userIds }, groupId: group._id });
    const promises = records.map((r) => r.remove());
    return Promise.all(promises);
  }
});

// Delete Messages if associated User is deleted.
OnUserConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Message.find({
        $or: [{ fromUserId: payload.fullDocument._id }, { toUserId: payload.fullDocument._id }],
      });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
