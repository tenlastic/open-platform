import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnUserConsumed } from '../user';
import { Login, LoginDocument } from './model';

export const OnLoginConsumed = new EventEmitter<IDatabasePayload<LoginDocument>>();

// Delete Logins if associated User is deleted.
OnUserConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Login.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
