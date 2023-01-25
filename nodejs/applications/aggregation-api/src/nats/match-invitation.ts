import { MatchInvitationModel } from '@tenlastic/mongoose';
import { log, MatchInvitationEvent, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Log the message.
MatchInvitationEvent.sync(log);

// Delete Match Invitations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchInvitationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
