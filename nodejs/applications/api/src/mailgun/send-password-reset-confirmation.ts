import mailgun from '@tenlastic/mailgun';

interface SendOptions {
  email: string;
}

export async function sendPasswordResetConfirmation(options: SendOptions) {
  const html = `
    Your password has been changed successfully.
    <br>
    <br>
    If this is unexpected, someone may have gained access to your account.
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
    from: 'Tenlastic Support <no-reply@tenlastic.com>',
    html,
    subject: 'Password Reset Successful',
    to: options.email,
  });
}
