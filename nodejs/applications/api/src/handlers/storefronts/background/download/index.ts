import * as minio from '@tenlastic/minio';
import { StorefrontPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

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
    'read',
    storefront,
  );
  if (!permissions.includes('background')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, storefront.getMinioKey('background'));
  const stream = await minio.getObject(bucket, storefront.getMinioKey('background'));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
