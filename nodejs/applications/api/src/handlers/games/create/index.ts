import { Game, GamePermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { access, namespaceId } = ctx.request.body;
  if (!namespaceId) {
    throw new RequiredFieldError(['namespaceId']);
  }

  await Game.checkNamespaceLimits(null, access, namespaceId);

  const credentials = { ...ctx.state };
  const result = await GamePermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await GamePermissions.read(credentials, result);

  ctx.response.body = { record };
}
