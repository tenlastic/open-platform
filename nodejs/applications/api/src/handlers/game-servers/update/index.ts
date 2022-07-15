import { GameServer, GameServerPermissions } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { cpu, memory, preemptible } = ctx.request.body;

  const credentials = { ...ctx.state };
  const existing = await GameServerPermissions.findOne(credentials, { where: ctx.params }, {});
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await GameServer.checkNamespaceLimits(
    existing._id,
    cpu || existing.cpu,
    memory || existing.memory,
    existing.namespaceId as any,
    preemptible || existing.preemptible,
  );

  const result = await GameServerPermissions.update(
    credentials,
    ctx.params,
    ctx.request.body,
    existing,
  );
  const record = await GameServerPermissions.read(credentials, result);

  ctx.response.body = { record };
}
