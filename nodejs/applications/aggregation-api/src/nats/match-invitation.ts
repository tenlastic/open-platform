import { MatchInvitationModel } from '@tenlastic/mongoose';
import { NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Match Invitations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchInvitationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
