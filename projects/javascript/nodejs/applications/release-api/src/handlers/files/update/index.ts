import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { File, FilePermissions, Release } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const where = await FilePermissions.where(
    { _id: ctx.params._id, platform: ctx.params.platform, releaseId: release._id },
    ctx.state.user,
  );
  const record = await File.findOne(where).populate(FilePermissions.accessControl.options.populate);
  if (!record) {
    throw new RecordNotFoundError('File');
  }

  const override = { platform: ctx.params.platform, releaseId: ctx.params.releaseId };
  const result = await FilePermissions.update(record, ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
