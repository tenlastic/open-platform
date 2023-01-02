import * as minio from '@tenlastic/minio';
import {
  NamespaceModel,
  NamespaceLimitError,
  StorefrontModel,
  StorefrontPermissions,
} from '@tenlastic/mongoose';
import { NamespaceStorageLimitEvent } from '@tenlastic/mongoose-nats';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

import { MinioStorefront } from '../../../../minio';

export async function handler(ctx: Context) {
  const { _id, field, namespaceId } = ctx.params;

  const namespace = await NamespaceModel.findOne({ _id: namespaceId });
  namespace.checkStorageLimit(0);
  const limit = Math.min(
    25 * 1000 * 1000,
    namespace.limits.storage - namespace.status.limits.storage,
  );

  const credentials = { ...ctx.state };
  const storefront = await StorefrontPermissions.findOne(credentials, { where: { _id } }, {});
  if (!storefront) {
    throw new RecordNotFoundError('Storefront');
  }

  // Get permissions for the Storefront
  const permissions = await StorefrontPermissions.getFieldPermissions(
    credentials,
    'update',
    storefront,
  );
  if (!permissions.includes(field)) {
    throw new PermissionError();
  }

  // Parse files from request body.
  const objectNames: string[] = [];
  await new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: ctx.request.headers, limits: { files: 1, fileSize: limit } });
    let promise = Promise.resolve('');

    busboy.on('error', reject);
    busboy.on('file', (name, stream, info) => {
      const objectName = MinioStorefront.getObjectName(
        storefront.namespaceId,
        storefront._id,
        field,
      );
      objectNames.push(objectName);

      // Make sure the file is a valid size.
      stream.on('error', reject);
      stream.on('limit', () => {
        if (limit >= 25 * 1000 * 1000) {
          stream.destroy(new Error('File size must be smaller than 25MB.'));
        } else {
          stream.destroy(new NamespaceLimitError('storage'));
        }
      });

      // Make sure the file is an image.
      const { mimeType } = info;
      if (field === 'videos' && mimeType !== 'video/mp4') {
        stream.destroy(new Error('Mimetype must be: video/mp4.'));
        return;
      } else if (
        field !== 'videos' &&
        mimeType !== 'image/gif' &&
        mimeType !== 'image/jpeg' &&
        mimeType !== 'image/png'
      ) {
        stream.destroy(new Error('Mimetype must be: image/gif, image/jpeg, image/png.'));
        return;
      }

      // Stop the upload when storage limit is reached.
      const listener = () => stream.destroy(new NamespaceLimitError('storage'));
      NamespaceStorageLimitEvent.sync(listener);

      // Upload to Minio.
      promise = minio
        .putObject(process.env.MINIO_BUCKET, objectName, stream, { 'content-type': mimeType })
        .finally(() => NamespaceStorageLimitEvent.remove(listener));
    });
    busboy.on('filesLimit', () => reject('Cannot upload more than one file at once.'));
    busboy.on('finish', () => promise.then(resolve).catch(reject));

    ctx.req.pipe(busboy);
  });

  const urls = objectNames.map((on) =>
    MinioStorefront.getUrl(ctx.request.host, on, ctx.request.protocol),
  );
  const result = await StorefrontModel.findOneAndUpdate(
    { _id: storefront._id },
    ['images', 'videos'].includes(field) ? { $addToSet: { [field]: urls } } : { [field]: urls[0] },
    { new: true },
  );
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
