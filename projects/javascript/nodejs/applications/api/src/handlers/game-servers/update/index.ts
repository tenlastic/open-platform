import { GameServer, GameServerPermissions } from '@tenlastic/mongoose-models';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, isPreemptible, memory } = ctx.request.body;

  const existing = await GameServerPermissions.findOne({}, { where: ctx.params }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await GameServer.checkNamespaceLimits(
    existing._id,
    cpu || existing.cpu,
    isPreemptible || existing.isPreemptible,
    memory || existing.memory,
    existing.namespaceId as any,
  );

  const result = await GameServerPermissions.update(
    existing,
    ctx.request.body,
    ctx.params,
    ctx.state.user,
  );
  const record = await GameServerPermissions.read(result, user);

  ctx.response.body = { record };
}
