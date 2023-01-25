import { MatchModel } from '@tenlastic/mongoose';
import { log, MatchEvent, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Log the message.
MatchEvent.sync(log);

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
