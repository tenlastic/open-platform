import { LoginModel } from '@tenlastic/mongoose';
import { UserEvent } from '@tenlastic/mongoose-nats';

// Delete Logins if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return LoginModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
