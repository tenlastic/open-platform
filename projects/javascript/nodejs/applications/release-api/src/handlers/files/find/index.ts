import * as minio from '@tenlastic/minio';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { File, FilePermissions, FileSchema, Release } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const override = { where: { releaseId: release._id } };
  const result = await FilePermissions.find(ctx.request.query, override, ctx.state.user);

  for (const file of result) {
    try {
      const stats = await minio.getClient().statObject(FileSchema.bucket, file.key);

      if (file.md5 !== stats.etag) {
        file.md5 = stats.etag;
        await file.save();
      }
    } catch (e) {
      console.error(`Minio release object not found: ${file.key}.`);
    }
  }

  const promises = result.map(r =>
    minio.getClient().presignedGetObject(FileSchema.bucket, r.key, 60 * 60),
  );
  const presignedUrls = await Promise.all(promises);

  ctx.response.body = { presignedUrls, records: result };
}
