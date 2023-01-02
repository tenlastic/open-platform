import { MatchModel } from '@tenlastic/mongoose';
import { NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
