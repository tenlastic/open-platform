import * as minio from '@tenlastic/minio';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { File, FilePermissions, FileSchema, Release } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const where = await FilePermissions.where(
    { releaseId: release._id, name: ctx.params.name },
    ctx.state.user,
  );
  const record = await File.findOne(where).populate(FilePermissions.accessControl.options.populate);
  if (!record) {
    throw new RecordNotFoundError('File');
  }

  const override = { releaseId: ctx.params.releaseId };
  const result = await FilePermissions.update(record, ctx.request.body, override, ctx.state.user);

  const presignedUrl = await minio
    .getClient()
    .presignedPutObject(FileSchema.bucket, result.key, 24 * 60 * 60);

  ctx.response.body = { presignedUrl, record: result };
}
