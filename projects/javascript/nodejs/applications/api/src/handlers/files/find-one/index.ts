import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { FilePermissions, Release } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const override = {
    where: {
      _id: ctx.params._id,
      platform: ctx.params.platform,
      releaseId: release._id,
    },
  };
  const result = await FilePermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('File');
  }

  ctx.response.body = { record: result };
}
