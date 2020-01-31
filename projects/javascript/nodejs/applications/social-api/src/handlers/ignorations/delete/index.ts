import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { IgnorationPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const record = await IgnorationPermissions.findOne({}, override, ctx.state.user);
  if (!record) {
    throw new RecordNotFoundError('Ignoration');
  }

  const result = await IgnorationPermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
