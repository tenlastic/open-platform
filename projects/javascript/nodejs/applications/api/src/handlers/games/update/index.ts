import { Game, GamePermissions } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { access } = ctx.request.body;

  const existing = await GamePermissions.findOne({}, { where: ctx.params }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await Game.checkNamespaceLimits(existing._id, access || existing.access, existing.namespaceId);

  const result = await GamePermissions.update(existing, ctx.request.body, ctx.params, user);
  const record = await GamePermissions.read(result, user);

  ctx.response.body = { record };
}
