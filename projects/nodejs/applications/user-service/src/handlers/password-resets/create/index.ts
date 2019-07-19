import { Context } from '@tenlastic/api-module';
import * as Chance from 'chance';

import { PasswordReset, User } from '../../../models';

const chance = new Chance();

export async function handler(ctx: Context) {
  const { email } = ctx.request.body;
  if (!email) {
    throw new Error('Missing required parameters: email.');
  }

  const user = await User.findOne({ email });

  if (user) {
    const hash = chance.hash({ length: 128 });
    await PasswordReset.create({ hash, userId: user._id });
  }

  ctx.response.status = 200;
}
