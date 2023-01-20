import { LoginModel } from '@tenlastic/mongoose';
import { LoginEvent, UserEvent } from '@tenlastic/mongoose-nats';

// Log the message.
LoginEvent.sync((payload) => {
  console.log({
    documentKey: payload.documentKey,
    ns: payload.ns,
    operationType: payload.operationType,
  });
});

// Delete Logins if associated User is deleted.
UserEvent.async(async (payload) => {
  console.log({
    documentKey: payload.documentKey,
    ns: payload.ns,
    operationType: payload.operationType,
  });

  switch (payload.operationType) {
    case 'delete':
      return LoginModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
