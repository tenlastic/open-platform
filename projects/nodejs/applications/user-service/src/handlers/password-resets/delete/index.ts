import { Context } from '@tenlastic/api-module';
import * as mongoose from 'mongoose';

import { PasswordReset, RefreshToken, User } from '../../../models';

export async function handler(ctx: Context) {
  const { hash } = ctx.params;

  const { password } = ctx.request.body;
  if (!password) {
    throw new Error('Missing required parameters: password.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete the PasswordReset.
    const passwordReset = await PasswordReset.findOneAndDelete({ hash });

    // Update the User's password.
    const passwordHash = await User.hashPassword(password);
    await User.updateOne({ _id: passwordReset.userId }, { password: passwordHash });

    // Remove all User's RefreshTokens to prevent malicious logins.
    await RefreshToken.deleteMany({ userId: passwordReset.userId });

    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();

    throw new Error('Something went wrong. Please try again.');
  } finally {
    session.endSession();
  }

  ctx.response.status = 200;
}
