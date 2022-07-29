import * as minio from '@tenlastic/minio';
import { StorefrontPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, storefrontId } = ctx.params;

  const credentials = { ...ctx.state };
  const storefront = await StorefrontPermissions.findOne(
    credentials,
    { where: { _id: storefrontId } },
    {},
  );
  if (!storefront) {
    throw new RecordNotFoundError('Storefront');
  }

  // Get permissions for the Storefront
  const permissions = await StorefrontPermissions.getFieldPermissions(
    credentials,
    'read',
    storefront,
  );
  if (!permissions.includes('images')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, storefront.getMinioKey('images', _id));
  const stream = await minio.getObject(bucket, storefront.getMinioKey('images', _id));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
