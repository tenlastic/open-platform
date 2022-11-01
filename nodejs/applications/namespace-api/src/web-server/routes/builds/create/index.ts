import * as minio from '@tenlastic/minio';
import { Context } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

import { Build, BuildPermissions, Namespace, NamespaceLimitError } from '../../../../mongodb';

export async function handler(ctx: Context) {
  const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
  namespace.checkCpuLimit(0.1);
  namespace.checkMemoryLimit(100 * 1000 * 1000);
  namespace.checkStorageLimit(0);
  const limit = namespace.limits.storage - (namespace.status?.limits?.storage || 0);

  const build = new Build();
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
      stream.on('limit', () => busboy.emit('error', new NamespaceLimitError('storage')));

      // Make sure the file is an image.
      const { mimeType } = info;
      if (mimeType !== 'application/zip') {
        busboy.emit('error', new Error('Mimetype must be: application/zip.'));
        return;
      }

      promise = minio.putObject(process.env.MINIO_BUCKET, build.getZipPath(), stream);
    });
    busboy.on('filesLimit', () => reject('Cannot upload more than one file at once.'));
    busboy.on('finish', () => promise.then(resolve).catch(reject));

    ctx.req.pipe(busboy);
  });

  try {
    const credentials = { ...ctx.state };
    const result = await BuildPermissions.create(credentials, { _id: build._id }, build.toObject());
    const record = await BuildPermissions.read(credentials, result);

    ctx.response.body = { record };
  } catch (e) {
    await minio.removeObject(process.env.MINIO_BUCKET, build.getZipPath());
    throw e;
  }
}
