import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { FriendPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const record = await FriendPermissions.findOne({}, override, ctx.state.user);
  if (!record) {
    throw new RecordNotFoundError('Friend');
  }

  const result = await FriendPermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
