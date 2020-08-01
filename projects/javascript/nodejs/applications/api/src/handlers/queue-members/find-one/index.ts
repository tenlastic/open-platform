import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { QueueMemberPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await QueueMemberPermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Queue Member');
  }

  ctx.response.body = { record: result };
}
