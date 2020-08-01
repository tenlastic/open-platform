import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { QueuePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await QueuePermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Queue');
  }

  ctx.response.body = { record: result };
}
