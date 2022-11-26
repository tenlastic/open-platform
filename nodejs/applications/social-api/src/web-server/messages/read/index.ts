import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Message, MessagePermissions } from '../../../mongodb';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const message = await MessagePermissions.findOne(
    credentials,
    { where: { _id: ctx.params._id } },
    {},
  );
  if (!message) {
    throw new RecordNotFoundError('Message');
  }

  const result = await Message.findOneAndUpdate(
    { _id: ctx.params._id },
    { $addToSet: { readByUserIds: ctx.state.user._id } },
    { new: true },
  );
  const record = await MessagePermissions.read(credentials, result);

  ctx.response.body = { record };
}
