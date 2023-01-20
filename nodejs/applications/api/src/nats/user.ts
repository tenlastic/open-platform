import { UserEvent } from '@tenlastic/mongoose-nats';

import mailgun from '../mailgun';

// Log the message.
UserEvent.sync((payload) => {
  console.log({
    documentKey: payload.documentKey,
    ns: payload.ns,
    operationType: payload.operationType,
  });
});

// Send a Password Reset Confirmation to the User's email address.
UserEvent.async((payload) => {
  if (payload.operationType === 'update' && payload.updateDescription.updatedFields.password) {
    return mailgun.sendPasswordResetConfirmation({ email: payload.fullDocument.email });
  }
});
