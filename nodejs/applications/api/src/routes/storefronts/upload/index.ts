import * as minio from '@tenlastic/minio';
import {
  Namespace,
  NamespaceLimitError,
  Storefront,
  StorefrontPermissions,
} from '../../../mongodb';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

export async function handler(ctx: Context) {
  const { _id, field } = ctx.params;

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

  const namespace = await Namespace.findOne({ _id: storefront.namespaceId });
  const limit = namespace.limits.storage;

  // Parse files from request body.
  const paths: string[] = [];
  await new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers, limits: { fileSize: limit } });

    busboy.on('error', reject);
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const path = storefront.getMinioKey(field);
      paths.push(path);

      // Make sure the file is an image.
      if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        busboy.emit('error', new Error('Mimetype must be: image/gif, image/jpeg, image/png.'));
        return;
      }

      // Make sure the file is a valid size.
      file.on('limit', () => busboy.emit('error', new NamespaceLimitError('storage', limit)));

      minio.putObject(process.env.MINIO_BUCKET, path, file, { 'content-type': mimetype });
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  const urls = paths.map((p) => storefront.getUrl(ctx.request.host, ctx.request.protocol, p));
  const result = await Storefront.findOneAndUpdate(
    { _id: storefront._id },
    ['images', 'videos'].includes(field) ? { $addToSet: { [field]: urls } } : { [field]: urls[0] },
  );
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
