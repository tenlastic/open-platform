import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { Login, LoginDocument } from '../mongodb';
import { UserEvent } from './user';

export const LoginEvent = new EventEmitter<IDatabasePayload<LoginDocument>>();

// Delete Logins if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Login.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
