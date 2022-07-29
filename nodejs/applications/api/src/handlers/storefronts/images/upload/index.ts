import * as minio from '@tenlastic/minio';
import { NamespaceLimitError, Storefront, StorefrontPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const storefront = await StorefrontPermissions.findOne(
    credentials,
    { where: { _id: ctx.params._id } },
    {},
  );
  if (!storefront) {
    throw new RecordNotFoundError('Storefront');
  }

  // Get permissions for the Storefront
  const permissions = await StorefrontPermissions.getFieldPermissions(
    credentials,
    'update',
    storefront,
  );
  if (!permissions.includes('images')) {
    throw new PermissionError();
  }

  const limits = storefront.namespaceDocument.limits.storefronts;
  const fileSize = limits.size || Infinity;

  // Parse files from request body.
  const paths: string[] = [];
  await new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers, limits: { fileSize } });

    busboy.on('error', reject);
    busboy.on('file', (field, stream, filename, encoding, mimetype) => {
      const path = storefront.getMinioKey('images');
      paths.push(path);

      // Make sure the file is an image.
      if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        busboy.emit('error', new Error('Mimetype must be: image/gif, image/jpeg, image/png.'));
        return;
      }

      // Make sure the file is a valid size.
      stream.on('limit', () =>
        busboy.emit('error', new NamespaceLimitError('storefronts.size', limits.size)),
      );

      minio.putObject(process.env.MINIO_BUCKET, path, stream, { 'content-type': mimetype });
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  const host = ctx.request.host.replace('api', 'cdn');
  const urls = paths.map((p) => storefront.getUrl(host, ctx.request.protocol, p));
  if (limits.images > 0 && storefront.images.length + urls.length > limits.images) {
    throw new NamespaceLimitError('storefronts.images', limits.images);
  }

  const result = await Storefront.findOneAndUpdate(
    { _id: storefront._id },
    { $addToSet: { images: urls } },
  );
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
