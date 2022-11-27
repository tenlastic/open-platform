import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { Login, LoginDocument } from '../mongodb';
import { UserEvent } from './user';

export const LoginEvent = new EventEmitter<IDatabasePayload<LoginDocument>>();

// Delete Logins if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Login.deleteMany({ userId: payload.fullDocument._id });
  }
});
