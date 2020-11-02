import * as minio from '@tenlastic/minio';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as JSZip from 'jszip';

import { Release, FilePermissions } from '@tenlastic/mongoose-models';

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
  const files = await FilePermissions.find(
    {},
    { limit: 10000, where: query },
    ctx.state.apiKey || ctx.state.user,
  );

  if (files.length === 0) {
    throw new RecordNotFoundError('Files');
  }

  const zip = new JSZip();
  for (const file of files) {
    const minioKey = await file.getMinioKey();
    const stream = await minio.getObject(process.env.MINIO_BUCKET, minioKey);
    zip.file(file.path, stream);
  }

  ctx.response.body = zip.generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: { level: 5 },
  });
}
