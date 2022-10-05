import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { Authorization, AuthorizationDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';
import { UserEvent } from './user';

export const AuthorizationEvent = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();

// Delete Authorizations if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Authorization.find({ namespaceId: payload.fullDocument._id });
      console.log(records);
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Authorizations if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Authorization.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
