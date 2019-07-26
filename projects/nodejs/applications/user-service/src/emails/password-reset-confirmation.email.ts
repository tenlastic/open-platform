import * as mailgun from '@tenlastic/mailgun-module';

import { UserUpdated } from '../models';

UserUpdated.on(async payload => {
  if (payload.before.password === payload.after.password) {
    return;
  }

  const html = `
    Your password was reset successfully.
    <br>
    <br>
    If you did not recently reset your password, someone may be trying to gain access to your account.
    <br>
    Please email us at <a href="mailto:support@tenlastic.com">support@tenlastic.com</a>
    if you believe this to be fraudulent.
    <br>
    <br>
    Thank you,
    <br>
    Tenlastic Support Team
  `;

  return mailgun.send({
    from: 'no-reply@tenlastic.com',
    html,
    subject: 'Password Reset Successful',
    to: payload.after.email,
  });
});
