import * as mailgun from '@tenlastic/mailgun-module';

import { UserDocument } from '../models';

export async function send(user: UserDocument) {
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
    to: user.email,
  });
}
