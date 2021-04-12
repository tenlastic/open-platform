import { GameServer, GameServerPermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, isPreemptible, memory, namespaceId } = ctx.request.body;
  if (!cpu || !memory || !namespaceId) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId']);
  }

  await GameServer.checkNamespaceLimits(null, cpu, isPreemptible || false, memory, namespaceId);

  const result = await GameServerPermissions.create(ctx.request.body, ctx.params, user);
  const record = await GameServerPermissions.read(result, user);

  ctx.response.body = { record };
}
