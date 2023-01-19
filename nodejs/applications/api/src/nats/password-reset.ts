import { UserModel } from '@tenlastic/mongoose';
import { PasswordResetEvent } from '@tenlastic/mongoose-nats';

import mailgun from '../mailgun';

// Send a Password Reset Request to the User's email address.
PasswordResetEvent.async(async (payload) => {
  const { fullDocument } = payload;

  console.log(`Password Reset Event.`);

  if (payload.operationType === 'insert') {
    console.log(`Sending Password Reset Request...`);
    const user = await UserModel.findOne({ _id: fullDocument.userId });
    const response = await mailgun.sendPasswordResetRequest({
      email: user.email,
      hash: fullDocument.hash,
    });
    console.log(`Password Reset Request status code: ${response.status}.`);
  }
});
