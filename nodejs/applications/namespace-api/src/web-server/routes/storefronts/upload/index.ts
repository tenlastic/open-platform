import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

import {
  Namespace,
  NamespaceLimitError,
  Storefront,
  StorefrontPermissions,
} from '../../../../mongodb';
import { NamespaceStorageLimitEvent } from '../../../../nats';

export async function handler(ctx: Context) {
  const { _id, field, namespaceId } = ctx.params;

  const namespace = await Namespace.findOne({ _id: namespaceId });
  namespace.checkStorageLimit(0);
  const limit = namespace.limits.storage - (namespace.status?.limits?.storage || 0);

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
  const paths: string[] = [];
  await new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: ctx.request.headers, limits: { files: 1, fileSize: limit } });
    let promise = Promise.resolve('');

    busboy.on('error', reject);
    busboy.on('file', (name, stream, info) => {
      const path = storefront.getMinioKey(field);
      paths.push(path);

      // Make sure the file is a valid size.
      stream.on('error', reject);
      stream.on('limit', () => busboy.emit('error', new NamespaceLimitError('storage')));

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
      NamespaceStorageLimitEvent.sync(() => stream.destroy(new NamespaceLimitError('storage')));

      // Upload to Minio.
      promise = minio.putObject(process.env.MINIO_BUCKET, path, stream, {
        'content-type': mimeType,
      });
    });
    busboy.on('filesLimit', () => reject('Cannot upload more than one file at once.'));
    busboy.on('finish', () => promise.then(resolve).catch(reject));

    ctx.req.pipe(busboy);
  });

  const urls = paths.map((p) => storefront.getUrl(ctx.request.host, ctx.request.protocol, p));
  const result = await Storefront.findOneAndUpdate(
    { _id: storefront._id },
    ['images', 'videos'].includes(field) ? { $addToSet: { [field]: urls } } : { [field]: urls[0] },
    { new: true },
  );
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
