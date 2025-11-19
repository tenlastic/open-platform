import { MatchModel } from '@tenlastic/mongoose';
import { log, MatchEvent, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Log the message.
MatchEvent.sync(log);

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
