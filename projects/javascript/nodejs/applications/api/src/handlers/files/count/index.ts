import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { FilePermissions, Release } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const override = { platform: ctx.params.platform, releaseId: release._id };
  const result = await FilePermissions.count(ctx.request.query.where, override, ctx.state.user);

  ctx.response.body = { count: result };
}
