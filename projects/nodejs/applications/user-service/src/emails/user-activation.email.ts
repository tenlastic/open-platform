import * as mailgun from '@tenlastic/mailgun-module';

import { UserUpdated } from '../models';

UserUpdated.on(payload => {
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
});
