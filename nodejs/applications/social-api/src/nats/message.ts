import { EventEmitter, IDatabasePayload, MessageDocument, MessageModel } from '@tenlastic/mongoose';

import { GroupEvent } from './group';
import { UserEvent } from './user';

export const MessageEvent = new EventEmitter<IDatabasePayload<MessageDocument>>();

// Delete Messages if associated Group is deleted.
GroupEvent.async(async (payload) => {
  const group = payload.fullDocument;

  if (payload.operationType === 'delete') {
    return MessageModel.deleteMany({ groupId: group._id });
  } else if (payload.operationType === 'update') {
    return MessageModel.deleteMany({ fromUserId: { $nin: group.userIds }, groupId: group._id });
  }
});

// Delete Messages if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MessageModel.deleteMany({
        $or: [{ fromUserId: payload.fullDocument._id }, { toUserId: payload.fullDocument._id }],
      });
  }
});
