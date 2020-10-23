import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ReleaseTaskPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const record = await ReleaseTaskPermissions.findOne(
    {},
    { where: { _id: ctx.params._id, releaseId: ctx.params.releaseId } },
    ctx.state.user,
  );
  if (!record) {
    throw new RecordNotFoundError('Release');
  }

  const result = await ReleaseTaskPermissions.delete(record, ctx.state.apiKey || ctx.state.user);

  ctx.response.body = { record: result };
}
