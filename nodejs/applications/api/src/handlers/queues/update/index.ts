import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { cpu, memory, preemptible, replicas } = ctx.request.body;

  const credentials = { ...ctx.state };
  const existing = await QueuePermissions.findOne(credentials, { where: ctx.params }, {});
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

  const result = await QueuePermissions.update(credentials, ctx.params, ctx.request.body, existing);
  const record = await QueuePermissions.read(credentials, result);

  ctx.response.body = { record };
}
