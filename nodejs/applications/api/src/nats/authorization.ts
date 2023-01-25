import { AuthorizationModel } from '@tenlastic/mongoose';
import { AuthorizationEvent, log, NamespaceEvent, UserEvent } from '@tenlastic/mongoose-nats';

// Log the message.
AuthorizationEvent.sync(log);

// Delete Authorizations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  console.log({
    documentKey: payload.documentKey,
    ns: payload.ns,
    operationType: payload.operationType,
  });

  switch (payload.operationType) {
    case 'delete':
      return AuthorizationModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Authorizations if associated User is deleted.
UserEvent.async(async (payload) => {
  console.log({
    documentKey: payload.documentKey,
    ns: payload.ns,
    operationType: payload.operationType,
  });

  switch (payload.operationType) {
    case 'delete':
      return AuthorizationModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
