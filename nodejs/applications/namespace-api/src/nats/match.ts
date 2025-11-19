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
    await MatchModel.findOneAndUpdate(
      { _id: matchId, finishedAt: { $exists: false } },
      { finishedAt: new Date() },
    );
  }
});

// Log the message.
MatchEvent.sync(log);

// Starts a Match if all Match Invitations have been accepted.
// Deletes a Match if a Match Invitation has been declined.
MatchEvent.async(async (payload) => {
  if (payload.operationType !== 'update') {
    return;
  }

  const { fullDocument } = payload;
  if (!fullDocument.invitationsExpireAt || fullDocument.startedAt) {
    return;
  }

  if (
    fullDocument.acceptedUserIds.length === fullDocument.userIds.length &&
    payload.updateDescription.updatedFields.acceptedUserIds
  ) {
    await MatchModel.findOneAndUpdate(
      { _id: fullDocument._id, startedAt: { $exists: false } },
      { startedAt: new Date() },
    );
  } else if (
    fullDocument.declinedUserIds.length > 0 &&
    payload.updateDescription.updatedFields.declinedUserIds
  ) {
    await MatchModel.deleteOne({
      _id: fullDocument._id,
      invitationsExpireAt: { $exists: true },
      startedAt: { $exists: false },
    });
  }
});

// Updates a Match when a Match Invitation has been accepted or declined.
MatchInvitationEvent.async(async (payload) => {
  if (payload.operationType !== 'update') {
    return;
  }

  if (payload.updateDescription.updatedFields.acceptedAt) {
    await MatchModel.findOneAndUpdate(
      { _id: payload.fullDocument.matchId },
      { $addToSet: { acceptedUserIds: payload.fullDocument.userId } },
    );
  } else if (payload.updateDescription.updatedFields.declinedAt) {
    await MatchModel.findOneAndUpdate(
      { _id: payload.fullDocument.matchId },
      { $addToSet: { declinedUserIds: payload.fullDocument.userId } },
    );
  }
});

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
