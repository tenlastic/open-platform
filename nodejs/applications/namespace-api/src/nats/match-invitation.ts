import { MatchInvitationModel } from '@tenlastic/mongoose';
import { MatchEvent, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Match Invitations if associated Match is deleted.
// Create Match Invitations if a Match with confirmation is created.
// Delete Match Invitations if associated Match is finished.
// Delete Match Invitations if the recipient was removed from the Match.
MatchEvent.async(async (payload) => {
  const match = payload.fullDocument;

  if (payload.operationType === 'delete') {
    return MatchInvitationModel.deleteMany({ matchId: match._id });
  } else if (payload.operationType === 'insert') {
    const expiresAt =
      match.confirmationExpiresAt && !match.startedAt
        ? match.confirmationExpiresAt
        : new Date(Date.now() + match.invitationSeconds * 1000);
    const values = {
      expiresAt,
      matchId: match._id,
      namespaceId: match.namespaceId,
      queueId: match.queueId,
    };

    const matchInvitations = match.userIds.map(
      (ui) => new MatchInvitationModel({ ...values, userId: ui }),
    );

    return MatchInvitationModel.create(matchInvitations);
  } else if (
    payload.operationType === 'update' &&
    payload.updateDescription.updatedFields.finishedAt
  ) {
    return MatchInvitationModel.deleteMany({ matchId: match._id });
  } else if (payload.operationType === 'update' && payload.updateDescription.updatedFields.teams) {
    return MatchInvitationModel.deleteMany({ matchId: match._id, userId: { $nin: match.userIds } });
  }
});

// Delete Match Invitations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchInvitationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
