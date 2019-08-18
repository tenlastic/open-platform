import { Context } from '@tenlastic/web-server';
import * as Chance from 'chance';

import { PasswordReset, User } from '../../../models';

const chance = new Chance();

export async function handler(ctx: Context) {
  const { email } = ctx.request.body;
  if (!email) {
    throw new Error('Missing required parameters: email.');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    const hash = chance.hash({ length: 128 });
    await PasswordReset.create({ expiresAt, hash, userId: user._id });
  }

  ctx.response.status = 200;
}
