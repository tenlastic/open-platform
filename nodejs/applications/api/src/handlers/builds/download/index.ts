import * as minio from '@tenlastic/minio';
import { BuildPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as JSZip from 'jszip';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const build = await BuildPermissions.findOne({}, { where: { _id: ctx.params._id } }, user);
  if (!build) {
    throw new RecordNotFoundError('Build');
  }

  const permissions = BuildPermissions.accessControl.getFieldPermissions('read', build, user);
  if (!permissions.includes('files.*')) {
    throw new PermissionError();
  }

  const files = ctx.request.query.files
    ? build.files.filter((f, i) => ctx.request.query.files[i] === '1')
    : build.files;

  const zip = new JSZip();
  for (const file of files) {
    const stream = await minio.getObject(process.env.MINIO_BUCKET, build.getFilePath(file.path));
    zip.file(file.path, stream);
  }

  ctx.response.body = zip.generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
    streamFiles: true,
  });
}
