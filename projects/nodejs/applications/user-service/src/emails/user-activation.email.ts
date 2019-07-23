import { DatabasePayload } from '@tenlastic/change-data-detection-module';
import * as mailgun from '@tenlastic/mailgun-module';

import { UserCreated, UserDocument, UserUpdated } from '../models';

function send(payload: DatabasePayload<UserDocument>) {
  if (payload.before.activatedAt || !payload.after.activatedAt) {
    return;
  }

  const html = `
    Congratulations! Your account has been activated. You may now log in at any time.
    <br>
    <br>
    Thank you,
    <br>
    Tenlastic Support Team
  `;

  return mailgun.send({
    from: 'no-reply@tenlastic.com',
    html,
    subject: 'Account Activated',
    to: payload.after.email,
  });
}

UserCreated.on(send);
UserUpdated.on(send);
