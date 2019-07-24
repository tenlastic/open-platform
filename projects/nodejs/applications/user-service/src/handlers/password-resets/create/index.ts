import { Context } from '@tenlastic/api-module';
import * as uuid from 'uuid/v4';

import { PasswordReset, User } from '../../../models';

export async function handler(ctx: Context) {
  const { email } = ctx.request.body;
  if (!email) {
    throw new Error('Missing required parameters: email.');
  }

  const user = await User.findOne({ email });

  if (user) {
    const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    const hash = uuid();
    await PasswordReset.create({ expiresAt, hash, userId: user._id });
  }

  ctx.response.status = 200;
}
