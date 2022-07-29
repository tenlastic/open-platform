import { Storefront, StorefrontPermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { access, namespaceId } = ctx.request.body;
  if (!namespaceId) {
    throw new RequiredFieldError(['namespaceId']);
  }

  await Storefront.checkNamespaceLimits(null, access, namespaceId);

  const credentials = { ...ctx.state };
  const result = await StorefrontPermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await StorefrontPermissions.read(credentials, result);

  ctx.response.body = { record };
}
