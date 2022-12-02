import {
  EventEmitter,
  IDatabasePayload,
  PasswordResetDocument,
  UserModel,
} from '@tenlastic/mongoose';

import mailgun from '../mailgun';

export const PasswordResetEvent = new EventEmitter<IDatabasePayload<PasswordResetDocument>>();

// Send a Password Reset Request to the User's email address.
PasswordResetEvent.async(async (payload) => {
  const { fullDocument } = payload;

  if (payload.operationType === 'insert') {
    const user = await UserModel.findOne({ _id: fullDocument.userId });
    return mailgun.sendPasswordResetRequest({ email: user.email, hash: fullDocument.hash });
  }
});
