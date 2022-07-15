import { Game, GamePermissions } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { access } = ctx.request.body;

  const credentials = { ...ctx.state };
  const existing = await GamePermissions.findOne(credentials, { where: ctx.params }, {});
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await Game.checkNamespaceLimits(existing._id, access || existing.access, existing.namespaceId);

  const result = await GamePermissions.update(credentials, ctx.params, ctx.request.body, existing);
  const record = await GamePermissions.read(credentials, result);

  ctx.response.body = { record };
}
