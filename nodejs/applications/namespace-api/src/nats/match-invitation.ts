import { MatchInvitationModel } from '@tenlastic/mongoose';
import {
  log,
  MatchEvent,
  MatchInvitationEvent,
  NamespaceEvent,
  QueueMemberEvent,
} from '@tenlastic/mongoose-nats';

// Delete Match Invitations if associated Match is deleted.
// Create Match Invitations if associated Match is created.
// Delete Match Invitations if associated Match is started.
MatchEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return MatchInvitationModel.deleteMany({ matchId: payload.fullDocument._id });
  } else if (payload.operationType === 'insert') {
    return MatchInvitationModel.createForMatch(payload.fullDocument);
  } else if (
    payload.operationType === 'update' &&
    payload.updateDescription.updatedFields.startedAt
  ) {
    return MatchInvitationModel.deleteMany({ matchId: payload.fullDocument._id });
  }
});

// Log the message.
MatchInvitationEvent.sync(log);

// Delete Match Invitations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchInvitationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Match Invitations if associated Queue Member is deleted.
QueueMemberEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const { queueId, userIds } = payload.fullDocument;
      return MatchInvitationModel.updateMany(
        { acceptedAt: { $exists: false }, queueId, userId: { $in: userIds } },
        { declinedAt: new Date() },
      );
  }
});
