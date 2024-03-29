import { LoginModel } from '@tenlastic/mongoose';
import { log, LoginEvent, UserEvent } from '@tenlastic/mongoose-nats';

// Log the message.
LoginEvent.sync(log);

// Delete Logins if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return LoginModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
