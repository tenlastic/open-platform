import { MatchModel } from '@tenlastic/mongoose';
import { GameServerEvent, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Matches if associated Namespace is deleted.
GameServerEvent.async(async (payload) => {
  if (payload.operationType === 'delete' && payload.fullDocument.matchId) {
    return MatchModel.updateOne({ _id: payload.fullDocument.matchId }, { finishedAt: new Date() });
  }
});

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
