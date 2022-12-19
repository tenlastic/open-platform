import { MatchModel } from '@tenlastic/mongoose';
import {
  GameServerEvent,
  MatchEvent,
  MatchInvitationEvent,
  NamespaceEvent,
} from '@tenlastic/mongoose-nats';

// Delete Matches if associated Namespace is deleted.
GameServerEvent.async(async (payload) => {
  const { matchId } = payload.fullDocument;

  if (payload.operationType === 'delete' && matchId) {
    return MatchModel.findOneAndUpdate({ _id: matchId }, { finishedAt: new Date() });
  }
});

// Starts a Match if all Match Invitations are accepted.
MatchEvent.async(async (payload) => {
  if (
    !payload.fullDocument.startedAt &&
    payload.operationType === 'update' &&
    payload.updateDescription.updatedFields.confirmedUserIds
  ) {
    const { confirmationExpiresAt, confirmedUserIds, userIds } = payload.fullDocument;

    if (confirmationExpiresAt && confirmedUserIds.length === userIds.length) {
      return MatchModel.findOneAndUpdate(
        { _id: payload.fullDocument._id },
        { startedAt: new Date() },
      );
    }
  }
});

// Deletes a Match if a Match Invitation is deleted or expires before confirmation.
// Confirms the User if a Match Invitation is accepted.
MatchInvitationEvent.async(async (payload) => {
  const { matchId, userId } = payload.fullDocument;

  if (payload.operationType === 'delete') {
    return MatchModel.deleteOne({
      _id: matchId,
      confirmationExpiresAt: { $exists: true },
      startedAt: { $exists: false },
    });
  } else if (
    payload.operationType === 'update' &&
    payload.updateDescription.updatedFields.acceptedAt
  ) {
    return MatchModel.findOneAndUpdate(
      { _id: matchId },
      { $addToSet: { confirmedUserIds: userId } },
    );
  }
});

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
