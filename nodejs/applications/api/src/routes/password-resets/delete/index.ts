import { Context, RequiredFieldError } from '@tenlastic/web-server';

import { PasswordReset, RefreshToken, User } from '../../../mongodb';

export async function handler(ctx: Context) {
  const { hash } = ctx.params;

  const { password } = ctx.request.query;
  if (!password) {
    throw new RequiredFieldError(['password']);
  }

  try {
    // Delete the PasswordReset.
    const passwordReset = await PasswordReset.findOneAndDelete({ hash });

    // Update the User's password.
    const passwordHash = await User.hashPassword(password);
    await User.findOneAndUpdate({ _id: passwordReset.userId }, { password: passwordHash });

    // Remove all User's RefreshTokens to prevent malicious logins.
    await RefreshToken.deleteMany({ userId: passwordReset.userId });
  } catch {}

  ctx.response.status = 200;
  ctx.response.body = {};
}
