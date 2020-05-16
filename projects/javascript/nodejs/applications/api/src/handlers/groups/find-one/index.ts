import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GroupPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await GroupPermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Group');
  }

  ctx.response.body = { record: result };
}
