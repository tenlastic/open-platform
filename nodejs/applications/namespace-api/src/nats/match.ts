import { MatchModel } from '@tenlastic/mongoose';
import {
  GameServerEvent,
  log,
  MatchEvent,
  MatchInvitationEvent,
  NamespaceEvent,
} from '@tenlastic/mongoose-nats';

// Mark Match as finished when Game Server is deleted.
GameServerEvent.async(async (payload) => {
  const { matchId } = payload.fullDocument;

  if (payload.operationType === 'delete' && matchId) {
    return MatchModel.findOneAndUpdate({ _id: matchId }, { finishedAt: new Date() });
  }
});

// Log the message.
MatchEvent.sync(log);

// Starts a Match if all Match Invitations have been accepted.
MatchEvent.async(async (payload) => {
  if (
    !payload.fullDocument.startedAt &&
    payload.operationType === 'update' &&
    payload.updateDescription.updatedFields.confirmedUserIds &&
    payload.fullDocument.confirmationExpiresAt &&
    payload.fullDocument.confirmedUserIds.length === payload.fullDocument.userIds.length
  ) {
    return MatchModel.findOneAndUpdate(
      { _id: payload.fullDocument._id },
      { startedAt: new Date() },
    );
  }
});

// Deletes a Match if a Match Invitation is deleted before confirmation.
// Confirms the User if a Match Invitation is accepted.
MatchInvitationEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return MatchModel.deleteOne({
      _id: payload.fullDocument.matchId,
      confirmationExpiresAt: { $exists: true },
      startedAt: { $exists: false },
    });
  } else if (
    payload.operationType === 'update' &&
    payload.updateDescription.updatedFields.acceptedAt
  ) {
    return MatchModel.findOneAndUpdate(
      { _id: payload.fullDocument.matchId },
      { $addToSet: { confirmedUserIds: payload.fullDocument.userId } },
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
