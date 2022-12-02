import {
  AuthorizationDocument,
  AuthorizationModel,
  EventEmitter,
  IDatabasePayload,
} from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';
import { UserEvent } from './user';

export const AuthorizationEvent = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();

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
