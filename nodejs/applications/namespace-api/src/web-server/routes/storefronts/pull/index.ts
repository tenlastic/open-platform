import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Storefront, StorefrontPermissions } from '../../../../mongodb';

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

  const path = storefront.getMinioKey(field, _id);
  await minio.removeObject(process.env.MINIO_BUCKET, path);

  const url = storefront.getUrl(ctx.request.host, ctx.request.protocol, path);
  const result = await Storefront.findOneAndUpdate(
    { _id: storefront._id },
    { $pull: { [field]: url } },
    { new: true },
  );
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
