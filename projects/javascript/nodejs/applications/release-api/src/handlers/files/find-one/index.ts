import * as minio from '@tenlastic/minio';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { FilePermissions, FileSchema, Release } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const override = { where: { releaseId: release._id, name: ctx.params.name } };
  const result = await FilePermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('File');
  }

  try {
    const stats = await minio.getClient().statObject(FileSchema.bucket, result.key);

    if (result.md5 !== stats.etag) {
      result.md5 = stats.etag;
      await result.save();
    }
  } catch (e) {
    console.error(`Minio release object not found: ${result.key}.`);
  }

  const presignedUrl = await minio
    .getClient()
    .presignedGetObject(
      FileSchema.bucket,
      `${result.releaseId}/${result.platform}/${result.path}`,
      60 * 60,
    );

  ctx.response.body = { presignedUrl, record: result };
}
