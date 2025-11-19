import * as minio from '@tenlastic/minio';
import { BuildModel, BuildPermissionOptions } from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as JSZip from 'jszip';
import { Readable } from 'stream';

import { MinioBuild } from '../../../../minio';

export type DownloadBuildContext = Context<
  { _id?: string },
  { compression?: number },
  NodeJS.ReadableStream
>;

export async function handler(ctx: DownloadBuildContext) {
  const context = {
    credentials: { ...ctx.state },
    Model: BuildModel,
    options: BuildPermissionOptions,
  };
  const build = await permissions.findOne(context, {}, { where: { _id: ctx.params._id } });
  if (!build) {
    throw new RecordNotFoundError('Build');
  }

  const fieldPermissions = await permissions.getFieldPermissions(context, 'read', build);
  if (!fieldPermissions.includes('files.*')) {
    throw new permissions.PermissionError();
  }

  const compression = ctx.request.query.compression || 3;
  const files = ctx.request.rawQuery?.files
    ? build.files.filter((f, i) => ctx.request.rawQuery.files[i] === '1')
    : build.files;

  const zip = new JSZip();
  for (const file of files) {
    const stream = await minio.getObject(
      process.env.MINIO_BUCKET,
      MinioBuild.getFileObjectName(build, file.path),
    );
    zip.file(file.path, stream as Readable);
  }

  ctx.response.body = zip.generateNodeStream({
    compression: compression > 0 ? 'DEFLATE' : 'STORE',
    compressionOptions: { level: compression },
    streamFiles: true,
  });
}
