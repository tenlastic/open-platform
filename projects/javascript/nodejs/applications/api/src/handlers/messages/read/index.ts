import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Message, MessagePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const message = await MessagePermissions.findOne(
    { where: { _id: ctx.params._id } },
    {},
    ctx.state.user,
  );
  if (!message) {
    throw new RecordNotFoundError('Message');
  }

  const result = await Message.findOneAndUpdate(
    { _id: ctx.params._id },
    { $addToSet: { readByUserIds: ctx.state.user._id } },
  );
  const record = await MessagePermissions.read(result, ctx.state.user);

  ctx.response.body = { record };
}
