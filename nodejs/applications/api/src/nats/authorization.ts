import { AuthorizationModel } from '@tenlastic/mongoose';
import {
  AuthorizationEvent,
  AuthorizationRequestEvent,
  log,
  NamespaceEvent,
  UserEvent,
} from '@tenlastic/mongoose-nats';

// Log the message.
AuthorizationEvent.sync(log);

// Deny / Grant Authorization Requests.
AuthorizationRequestEvent.async(async (payload) => {
  if (payload.operationType !== 'update') {
    return;
  }

  const { namespaceId, roles, userId } = payload.fullDocument;
  const { updatedFields } = payload.updateDescription;
  const where = namespaceId ? { namespaceId, userId } : { userId };

  if (updatedFields.deniedAt) {
    await AuthorizationModel.findOneAndUpdate(where, { $pull: { roles: { $in: roles } } });
  }

  if (updatedFields.grantedAt) {
    await AuthorizationModel.findOneAndUpdate(
      where,
      { ...where, $addToSet: { roles: { $each: roles } } },
      { upsert: true },
    );
  }
});

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
