import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { MessagePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await MessagePermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Message');
  }

  ctx.response.body = { record: result };
}
