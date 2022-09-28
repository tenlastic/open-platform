import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { Message, MessageDocument } from '../mongodb';
import { GroupEvent } from './group';
import { UserEvent } from './user';

export const MessageEvent = new EventEmitter<IDatabasePayload<MessageDocument>>();

// Delete Messages if associated Group is deleted.
GroupEvent.async(async (payload) => {
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
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Message.find({
        $or: [{ fromUserId: payload.fullDocument._id }, { toUserId: payload.fullDocument._id }],
      });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
