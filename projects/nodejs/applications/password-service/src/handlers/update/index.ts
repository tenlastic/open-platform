import { Context } from '@tenlastic/api-module';

import { Password } from '../../models';
import { handler as createHandler } from '../create';
import { router } from '../';

export async function handler(ctx: Context) {
  const { currentPlaintext, newPlaintext } = ctx.request.body;

  if (!currentPlaintext || !newPlaintext) {
    throw new Error('The following parameters are required: currentPlaintext and newPlaintext.');
  }

  let password = await Password.findOne({ userId: ctx.state.user._id });
  if (!password) {
    ctx.request.body = { plaintext: newPlaintext };
    return createHandler(ctx);
  }

  const isValid = await password.isValid(currentPlaintext);
  if (!isValid) {
    throw new Error('Invalid currentPlaintext value.');
  }

  password.hash = await Password.getHashFromPlaintext(newPlaintext);
  await password.save();

  ctx.response.status = 200;
}

router.put('/', handler);
