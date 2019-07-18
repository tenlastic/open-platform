import { Context } from '@tenlastic/api-module';

import { Password } from '../../models';
import { router } from '../';

export async function handler(ctx: Context) {
  const { plaintext } = ctx.request.body;
  if (!plaintext) {
    throw new Error('The following parameters are required: plaintext.');
  }

  const hash = await Password.getHashFromPlaintext(plaintext);
  await Password.create({ hash, userId: ctx.state.user._id });

  ctx.response.status = 200;
}

router.post('/', handler);
