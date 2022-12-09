import { UserEvent } from '@tenlastic/mongoose-nats';

import mailgun from '../mailgun';

// Send a Password Reset Confirmation to the User's email address.
UserEvent.async((payload) => {
  if (payload.operationType === 'update' && payload.updateDescription.updatedFields.password) {
    return mailgun.sendPasswordResetConfirmation({ email: payload.fullDocument.email });
  }
});
