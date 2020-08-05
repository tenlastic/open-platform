import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ReleasePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const record = await ReleasePermissions.findOne(
    {},
    { where: { _id: ctx.params._id } },
    ctx.state.user,
  );
  if (!record) {
    throw new RecordNotFoundError('Release');
  }

  const result = await ReleasePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
