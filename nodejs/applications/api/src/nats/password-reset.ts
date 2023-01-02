import { UserModel } from '@tenlastic/mongoose';
import { PasswordResetEvent } from '@tenlastic/mongoose-nats';

import mailgun from '../mailgun';

// Send a Password Reset Request to the User's email address.
PasswordResetEvent.async(async (payload) => {
  const { fullDocument } = payload;

  if (payload.operationType === 'insert') {
    const user = await UserModel.findOne({ _id: fullDocument.userId });
    return mailgun.sendPasswordResetRequest({ email: user.email, hash: fullDocument.hash });
  }
});
