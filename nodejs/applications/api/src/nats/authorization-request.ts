import { AuthorizationRequestModel } from '@tenlastic/mongoose';
import { AuthorizationRequestEvent, NamespaceEvent, UserEvent } from '@tenlastic/mongoose-nats';

// Log the message.
AuthorizationRequestEvent.sync((payload) => {
  console.log({
    documentKey: payload.documentKey,
    ns: payload.ns,
    operationType: payload.operationType,
  });
});

// Delete Authorization Requests if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return AuthorizationRequestModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Authorization Requests if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return AuthorizationRequestModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
