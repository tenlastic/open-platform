import { MatchInvitationModel } from '@tenlastic/mongoose';
import { MatchEvent, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Create Match Invitations if a Match with confirmation is created.
MatchEvent.async(async (payload) => {
  const match = payload.fullDocument;

  if (match.confirmationExpiresAt && payload.operationType === 'insert') {
    const expiresAt = match.confirmationExpiresAt;
    return MatchInvitationModel.create(match.userIds.map((ui) => ({ expiresAt, userId: ui })));
  }
});

// Delete Match Invitations if associated Match is deleted or is started.
MatchEvent.async(async (payload) => {
  if (
    payload.operationType === 'delete' ||
    (payload.operationType === 'update' && payload.updateDescription.updatedFields.startedAt)
  ) {
    return MatchInvitationModel.deleteMany({ matchId: payload.fullDocument._id });
  }
});

// Delete Match Invitations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchInvitationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
