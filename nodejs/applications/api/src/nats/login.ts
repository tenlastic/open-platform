import { EventEmitter, IDatabasePayload, Login, LoginDocument } from '@tenlastic/mongoose';

import { UserEvent } from './user';

export const LoginEvent = new EventEmitter<IDatabasePayload<LoginDocument>>();

// Delete Logins if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Login.deleteMany({ userId: payload.fullDocument._id });
  }
});
