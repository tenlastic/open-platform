import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { File, FilePermissions, Release } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const record = await FilePermissions.findOne(
    {},
    { where: { _id: ctx.params._id, platform: ctx.params.platform, releaseId: release._id } },
    ctx.state.user,
  );
  if (!record) {
    throw new RecordNotFoundError('File');
  }

  const result = await FilePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
