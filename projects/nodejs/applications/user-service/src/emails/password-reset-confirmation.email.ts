import * as mailgun from '@tenlastic/mailgun-module';

import { PasswordResetDeleted, User } from '../models';

PasswordResetDeleted.on(async payload => {
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

  const user = await User.findOne({ _id: payload.after.userId });

  return mailgun.send({
    from: 'no-reply@tenlastic.com',
    html,
    subject: 'Password Reset Successful',
    to: user.email,
  });
});
