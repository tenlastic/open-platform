import { GroupInvitationModel } from '@tenlastic/mongoose';
import { GroupEvent, GroupInvitationEvent, log, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Group Invitations when a User joins a group.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return GroupInvitationModel.deleteMany({ groupId: payload.fullDocument._id });
  } else {
    const userIds = payload.fullDocument.userIds;
    return GroupInvitationModel.deleteMany({ toUserId: { $in: userIds } });
  }
});

// Log the message.
GroupInvitationEvent.sync(log);

// Delete Group Invitations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return GroupInvitationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
