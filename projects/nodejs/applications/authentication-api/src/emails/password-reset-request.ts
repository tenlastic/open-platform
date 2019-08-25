import * as mailgun from '@tenlastic/mailgun';

import { PasswordResetDocument, User } from '../models';

export async function send(passwordReset: PasswordResetDocument) {
  const resetUrl = `${process.env.PASSWORD_RESET_URL}?hash=${passwordReset.hash}`;
  const html = `
    You have requested to reset your password.
    Please click the link below within 24 hours to create a new password:
    <br>
    <br>
    <a href=${resetUrl}>${resetUrl}</a>
    <br>
    <br>
    If you did not request this password reset,
    someone may be trying to gain access to your account.
    <br>
    Please email us at <a href="mailto:support@tenlastic.com">support@tenlastic.com</a>
    if you believe this to be fraudulent.
    <br>
    <br>
    Thank you,
    <br>
    Tenlastic Support Team
  `;

  const user = await User.findOne({ _id: passwordReset.userId });

  return mailgun.send({
    from: 'Tenlastic Support <no-reply@tenlastic.com>',
    html,
    subject: 'Password Reset Request',
    to: user.email,
  });
}
