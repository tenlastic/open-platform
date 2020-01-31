import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { MessagePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const record = await MessagePermissions.findOne({}, override, ctx.state.user);
  if (!record) {
    throw new RecordNotFoundError('Message');
  }

  const result = await MessagePermissions.update(record, ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
