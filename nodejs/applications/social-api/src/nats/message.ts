import { EventEmitter, IDatabasePayload, Message, MessageDocument } from '@tenlastic/mongoose';

import { GroupEvent } from './group';
import { UserEvent } from './user';

export const MessageEvent = new EventEmitter<IDatabasePayload<MessageDocument>>();

// Delete Messages if associated Group is deleted.
GroupEvent.async(async (payload) => {
  const group = payload.fullDocument;

  if (payload.operationType === 'delete') {
    return Message.deleteMany({ groupId: group._id });
  } else if (payload.operationType === 'update') {
    return Message.deleteMany({ fromUserId: { $nin: group.userIds }, groupId: group._id });
  }
});

// Delete Messages if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Message.deleteMany({
        $or: [{ fromUserId: payload.fullDocument._id }, { toUserId: payload.fullDocument._id }],
      });
  }
});
