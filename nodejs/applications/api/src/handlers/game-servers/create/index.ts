import { GameServer, GameServerPermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { cpu, memory, namespaceId, preemptible } = ctx.request.body;
  if (!cpu || !memory || !namespaceId) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId']);
  }

  await GameServer.checkNamespaceLimits(null, cpu, memory, namespaceId, preemptible || false);

  const credentials = { ...ctx.state };
  const result = await GameServerPermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await GameServerPermissions.read(credentials, result);

  ctx.response.body = { record };
}
