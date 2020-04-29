import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ReleasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ReleasePermissions.findOne(
    {},
    { where: { _id: ctx.params._id } },
    ctx.state.user,
  );
  if (!result) {
    throw new RecordNotFoundError('Release');
  }

  ctx.response.body = { record: result };
}
