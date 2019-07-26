import { Context } from '@tenlastic/api-module';

import { PasswordReset, User } from '../../../models';

export async function handler(ctx: Context) {
  const { hash } = ctx.params;

  const { password } = ctx.request.body;
  if (!password) {
    throw new Error('Missing required parameters: password.');
  }

  const passwordReset = await PasswordReset.findOneAndDelete({ hash });

  if (passwordReset) {
    const passwordHash = await User.hashPassword(password);
    await User.updateOne({ _id: passwordReset.userId }, { password: passwordHash });
  }

  ctx.response.status = 200;
}
