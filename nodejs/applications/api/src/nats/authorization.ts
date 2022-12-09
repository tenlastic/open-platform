import { AuthorizationModel } from '@tenlastic/mongoose';
import { NamespaceEvent, UserEvent } from '@tenlastic/mongoose-nats';

// Delete Authorizations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return AuthorizationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Authorizations if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return AuthorizationModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
