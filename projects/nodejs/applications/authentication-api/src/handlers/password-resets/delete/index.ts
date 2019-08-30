import { Context, RequiredFieldError } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { PasswordReset, RefreshToken, User } from '../../../models';

export async function handler(ctx: Context) {
  const { hash } = ctx.params;

  const { password } = ctx.request.query;
  if (!password) {
    throw new RequiredFieldError(['password']);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete the PasswordReset.
    const passwordReset = await PasswordReset.findOneAndDelete({ hash }).session(session);

    // Update the User's password.
    await User.findOneAndUpdate({ _id: passwordReset.userId }, { password }).session(session);

    // Remove all User's RefreshTokens to prevent malicious logins.
    await RefreshToken.deleteMany({ userId: passwordReset.userId }).session(session);

    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();

    throw new Error('Something went wrong. Please try again.');
  } finally {
    session.endSession();
  }

  ctx.response.status = 200;
}
