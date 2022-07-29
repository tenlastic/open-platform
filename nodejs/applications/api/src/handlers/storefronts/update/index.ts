import { Storefront, StorefrontPermissions } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { access } = ctx.request.body;

  const credentials = { ...ctx.state };
  const existing = await StorefrontPermissions.findOne(credentials, { where: ctx.params }, {});
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await Storefront.checkNamespaceLimits(
    existing._id,
    access || existing.access,
    existing.namespaceId,
  );

  const result = await StorefrontPermissions.update(
    credentials,
    ctx.params,
    ctx.request.body,
    existing,
  );
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
