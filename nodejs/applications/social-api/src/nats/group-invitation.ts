import { GroupInvitationModel } from '@tenlastic/mongoose';
import { GroupEvent } from '@tenlastic/mongoose-nats';

// Delete Group Invitations when a User joins a group.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  return GroupInvitationModel.deleteMany({ toUserId: { $in: payload.fullDocument.userIds } });
});
