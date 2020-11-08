import { GameServer, GameServerPermissions, NamespaceLimitError } from '@tenlastic/mongoose-models';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, isPreemptible, memory } = ctx.request.body;

  const existing = await GameServerPermissions.findOne({}, { where: ctx.params }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const limits = existing.namespaceDocument.limits.gameServers;
  if (limits.preemptible && isPreemptible === false) {
    throw new NamespaceLimitError('gameServers.preemptible');
  }

  if ((limits.cpu > 0 && cpu) || (limits.memory > 0 && memory)) {
    const results = await GameServer.aggregate([
      { $match: { namespaceId: existing.namespaceDocument._id } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          cpu: { $sum: '$cpu' },
          memory: { $sum: '$memory' },
        },
      },
    ]);

    const cpuSum = results.length > 0 ? results[0].cpu : 0;
    if (cpu && limits.cpu > 0 && cpuSum + (cpu - existing.cpu) > limits.cpu) {
      throw new NamespaceLimitError('gameServers.cpu');
    }

    const memorySum = results.length > 0 ? results[0].memory : 0;
    if (memory && limits.memory > 0 && memorySum + (memory - existing.memory) > limits.memory) {
      throw new NamespaceLimitError('gameServers.memory');
    }
  }

  const result = await GameServerPermissions.update(
    existing,
    ctx.request.body,
    ctx.params,
    ctx.state.user,
  );
  const record = await GameServerPermissions.read(result, user);

  ctx.response.body = { record };
}
