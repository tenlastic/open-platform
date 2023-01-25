import { GroupInvitationModel } from '@tenlastic/mongoose';
import { GroupEvent, GroupInvitationEvent, log } from '@tenlastic/mongoose-nats';

// Delete Group Invitations when a User joins a group.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  return GroupInvitationModel.deleteMany({ toUserId: { $in: payload.fullDocument.userIds } });
});

// Log the message.
GroupInvitationEvent.sync(log);
