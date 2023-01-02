import { PasswordResetModel, RefreshTokenModel, UserModel } from '@tenlastic/mongoose';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { hash } = ctx.params;

  const { password } = ctx.request.query;
  if (!password) {
    throw new RequiredFieldError(['password']);
  }

  try {
    // Delete the PasswordReset.
    const passwordReset = await PasswordResetModel.findOneAndDelete({ hash });

    // Update the User's password.
    const passwordHash = await UserModel.hashPassword(password);
    await UserModel.findOneAndUpdate({ _id: passwordReset.userId }, { password: passwordHash });

    // Remove all User's RefreshTokens to prevent malicious logins.
    await RefreshTokenModel.deleteMany({ userId: passwordReset.userId });
  } catch {}

  ctx.response.status = 200;
  ctx.response.body = {};
}
