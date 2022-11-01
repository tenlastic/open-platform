import * as minio from '@tenlastic/minio';
import { BuildPermissions } from '../../../../mongodb';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as JSZip from 'jszip';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const build = await BuildPermissions.findOne(credentials, { where: { _id: ctx.params._id } }, {});
  if (!build) {
    throw new RecordNotFoundError('Build');
  }

  const permissions = await BuildPermissions.getFieldPermissions(credentials, 'read', build);
  if (!permissions.includes('files.*')) {
    throw new PermissionError();
  }

  const files = ctx.request.query.files
    ? build.files.filter((f, i) => ctx.request.query.files[i] === '1')
    : build.files;

  const zip = new JSZip();
  for (const file of files) {
    const stream = await minio.getObject(process.env.MINIO_BUCKET, build.getFilePath(file.path));
    zip.file(file.path, stream as NodeJS.ReadableStream);
  }

  ctx.response.body = zip.generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
    streamFiles: true,
  });
}
