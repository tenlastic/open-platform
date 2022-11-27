import { EventEmitter, IDatabasePayload, UserDocument } from '@tenlastic/mongoose';

import mailgun from '../mailgun';

export const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();

// Send a Password Reset Confirmation to the User's email address.
UserEvent.async((payload) => {
  if (payload.operationType === 'update' && payload.updateDescription.updatedFields.password) {
    return mailgun.sendPasswordResetConfirmation({ email: payload.fullDocument.email });
  }
});
