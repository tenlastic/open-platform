import { UserModel } from '@tenlastic/mongoose';
import { log, PasswordResetEvent } from '@tenlastic/mongoose-nats';

import mailgun from '../mailgun';

// Log the message.
PasswordResetEvent.sync(log);

// Send a Password Reset Request to the User's email address.
PasswordResetEvent.async(async (payload) => {
  const { fullDocument } = payload;

  if (payload.operationType === 'insert') {
    const user = await UserModel.findOne({ _id: fullDocument.userId });
    await mailgun.sendPasswordResetRequest({ email: user.email, hash: fullDocument.hash });
  }
});
