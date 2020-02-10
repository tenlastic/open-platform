import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ReleaseJobPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const record = await ReleaseJobPermissions.findOne(
    {},
    { where: { _id: ctx.params._id, releaseId: ctx.params.releaseId } },
    ctx.state.user,
  );
  if (!record) {
    throw new RecordNotFoundError('Release');
  }

  const result = await ReleaseJobPermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
