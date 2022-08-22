import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { OnUserConsumed } from '../user';
import { Authorization, AuthorizationDocument } from './model';

export const OnAuthorizationConsumed = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();

// Delete Authorizations if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Authorization.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Authorizations if associated User is deleted.
OnUserConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Authorization.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
