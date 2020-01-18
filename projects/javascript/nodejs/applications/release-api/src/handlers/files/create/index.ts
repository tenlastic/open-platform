import * as minio from '@tenlastic/minio';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { FilePermissions, FileSchema, Release } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const override = { releaseId: release._id };
  const result = await FilePermissions.create(ctx.request.body, override, ctx.state.user);

  const presignedUrl = await minio
    .getClient()
    .presignedPutObject(FileSchema.bucket, result.key, 24 * 60 * 60);

  ctx.response.body = { presignedUrl, record: result };
}
