import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, memory, preemptible, replicas } = ctx.request.body;

  const existing = await QueuePermissions.findOne({}, { where: ctx.params }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await Queue.checkNamespaceLimits(
    existing._id,
    cpu || existing.cpu,
    memory || existing.memory,
    existing.namespaceId as any,
    preemptible || existing.preemptible,
    replicas || existing.replicas,
  );

  const result = await QueuePermissions.update(existing, ctx.request.body, ctx.params, user);
  const record = await QueuePermissions.read(result, user);

  ctx.response.body = { record };
}
