import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { FilePermissions, Release } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const override = { where: { platform: ctx.params.platform, releaseId: release._id } };
  const result = await FilePermissions.find(
    ctx.request.query,
    override,
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { records: result };
}
