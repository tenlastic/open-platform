import * as minio from '@tenlastic/minio';
import {
  StorefrontDocument,
  StorefrontModel,
  StorefrontPermissionOptions,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError, RecordResponse } from '@tenlastic/web-server';

import { MinioStorefront } from '../../../../minio';

export type PullStorefrontContext = Context<
  { _id?: string; field?: string; storefrontId?: string },
  void,
  RecordResponse<StorefrontDocument>
>;

export async function handler(ctx: PullStorefrontContext) {
  const { _id, field, storefrontId } = ctx.params;

  const context = {
    credentials: { ...ctx.state },
    Model: StorefrontModel,
    options: StorefrontPermissionOptions,
  };
  const storefront = await permissions.findOne(context, {}, { where: { _id: storefrontId } });
  if (!storefront) {
    throw new RecordNotFoundError('Storefront');
  }

  // Get permissions for the Storefront
  const fieldPermissions = await permissions.getFieldPermissions(context, 'update', storefront);
  if (!fieldPermissions.includes(field)) {
    throw new permissions.PermissionError();
  }

  const objectName = MinioStorefront.getObjectName(
    storefront.namespaceId,
    storefront._id,
    field,
    _id,
  );
  await minio.removeObject(process.env.MINIO_BUCKET, objectName);

  const url = MinioStorefront.getUrl(ctx.request.host, objectName, ctx.request.protocol);
  const result = await StorefrontModel.findOneAndUpdate(
    { _id: storefront._id },
    _id ? { $pull: { [field]: url } } : { $unset: { [field]: 1 } },
    { new: true },
  );
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
