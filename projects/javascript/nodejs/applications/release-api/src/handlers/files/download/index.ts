import * as minio from '@tenlastic/minio';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as JSZip from 'jszip';

import { Release, FileSchema, FilePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const release = await Release.findOne({ _id: ctx.params.releaseId });
  if (!release) {
    throw new RecordNotFoundError('Release');
  }

  const { include } = ctx.request.body;

  const query: any = { platform: ctx.params.platform, releaseId: release._id };
  if (include && include.length > 0) {
    query.path = { $in: include };
  }
  const files = await FilePermissions.find({}, { limit: 10000, where: query }, ctx.state.user);

  if (files.length === 0) {
    throw new RecordNotFoundError('Files');
  }

  const zip = new JSZip();
  for (const file of files) {
    const stream = (await minio.getClient().getObject(FileSchema.bucket, file.key)) as any;
    zip.file(file.path, stream);
  }

  ctx.response.body = zip.generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: { level: 5 },
  });
}
