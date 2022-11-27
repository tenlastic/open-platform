import * as minio from '@tenlastic/minio';
import { Storefront, StorefrontPermissions } from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { MinioStorefront } from '../../../../minio';

export async function handler(ctx: Context) {
  const { _id, field, storefrontId } = ctx.params;

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
    'update',
    storefront,
  );
  if (!permissions.includes(field)) {
    throw new PermissionError();
  }

  const objectName = MinioStorefront.getObjectName(
    storefront.namespaceId,
    storefront._id,
    field,
    _id,
  );
  await minio.removeObject(process.env.MINIO_BUCKET, objectName);

  const url = MinioStorefront.getUrl(ctx.request.host, objectName, ctx.request.protocol);
  const result = await Storefront.findOneAndUpdate(
    { _id: storefront._id },
    { $pull: { [field]: url } },
    { new: true },
  );
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
