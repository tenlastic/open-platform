import {
  GameServer,
  GameServerPermissions,
  Namespace,
  NamespaceLimitError,
} from '@tenlastic/mongoose-models';
import { RecordNotFoundError, RequiredFieldError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, isPreemptible, memory, namespaceId } = ctx.request.body;
  if (!cpu || !memory || !namespaceId) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId']);
  }

  const namespace = await Namespace.findOne({ _id: ctx.request.body.namespaceId });
  if (!namespace) {
    throw new RecordNotFoundError('Record');
  }

  const limits = namespace.limits.gameServers;
  if (limits.preemptible && !isPreemptible) {
    throw new NamespaceLimitError('gameServers.preemptible');
  }

  if (limits.count > 0 || limits.cpu > 0 || limits.memory > 0) {
    const results = await GameServer.aggregate([
      { $match: { namespaceId: namespace._id } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          cpu: { $sum: '$cpu' },
          memory: { $sum: '$memory' },
        },
      },
    ]);

    if (limits.count > 0 && results.length > 0 && results[0].count >= limits.count) {
      throw new NamespaceLimitError('gameServers.count');
    }

    const cpuSum = results.length > 0 ? results[0].cpu : 0;
    if (limits.cpu > 0 && cpuSum + cpu > limits.cpu) {
      throw new NamespaceLimitError('gameServers.cpu');
    }

    const memorySum = results.length > 0 ? results[0].memory : 0;
    if (limits.memory > 0 && memorySum + memory > limits.memory) {
      throw new NamespaceLimitError('gameServers.memory');
    }
  }

  const result = await GameServerPermissions.create(ctx.request.body, ctx.params, user);
  const record = await GameServerPermissions.read(result, user);

  ctx.response.body = { record };
}
