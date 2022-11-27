import {
  AuthorizationRequest,
  AuthorizationRequestDocument,
  EventEmitter,
  IDatabasePayload,
} from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';
import { UserEvent } from './user';

export const AuthorizationRequestEvent = new EventEmitter<
  IDatabasePayload<AuthorizationRequestDocument>
>();

// Delete Authorization Requests if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return AuthorizationRequest.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Authorization Requests if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return AuthorizationRequest.deleteMany({ userId: payload.fullDocument._id });
  }
});
