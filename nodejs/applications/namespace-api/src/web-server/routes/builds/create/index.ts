import * as minio from '@tenlastic/minio';
import {
  BuildModel,
  BuildPermissions,
  NamespaceModel,
  NamespaceLimitError,
} from '@tenlastic/mongoose';
import { NamespaceStorageLimitEvent } from '@tenlastic/mongoose-nats';
import { Context } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

import { MinioBuild } from '../../../../minio';

export async function handler(ctx: Context) {
  const namespace = await NamespaceModel.findOne({ _id: ctx.params.namespaceId });
  namespace.checkCpuLimit(0.1);
  namespace.checkMemoryLimit(100 * 1000 * 1000);
  namespace.checkStorageLimit(0);
  const limit = namespace.limits.storage - namespace.status.limits.storage;

  const build = new BuildModel({ ...ctx.params });
  await new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: ctx.request.headers, limits: { files: 1, fileSize: limit } });
    let promise = Promise.resolve('');

    busboy.on('error', reject);
    busboy.on('field', (name, value) => {
      if (name === 'record') {
        build.set(JSON.parse(value));
      }
    });
    busboy.on('file', (name, stream, info) => {
      if (name !== 'zip') {
        stream.resume();
        return;
      }

      // Make sure the file is a valid size.
      stream.on('error', reject);
      stream.on('limit', () => stream.destroy(new NamespaceLimitError('storage')));

      // Make sure the file is an image.
      const { mimeType } = info;
      if (mimeType !== 'application/zip') {
        stream.destroy(new Error('Mimetype must be: application/zip.'));
        return;
      }

      // Stop the upload when storage limit is reached.
      const listener = () => stream.destroy(new NamespaceLimitError('storage'));
      NamespaceStorageLimitEvent.sync(listener);

      // Upload to Minio
      promise = minio
        .putObject(process.env.MINIO_BUCKET, MinioBuild.getZipObjectName(build), stream)
        .finally(() => NamespaceStorageLimitEvent.remove(listener));
    });
    busboy.on('filesLimit', () => reject('Cannot upload more than one file at once.'));
    busboy.on('finish', () => promise.then(resolve).catch(reject));

    ctx.req.pipe(busboy);
  });

  try {
    const credentials = { ...ctx.state };
    const result = await BuildPermissions.create(
      credentials,
      { ...ctx.params, _id: build._id },
      build.toObject(),
    );
    const record = await BuildPermissions.read(credentials, result);

    ctx.response.body = { record };
  } catch (e) {
    await minio.removeObject(process.env.MINIO_BUCKET, MinioBuild.getZipObjectName(build));
    throw e;
  }
}
