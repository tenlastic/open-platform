import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, isPreemptible, memory } = ctx.request.body;

  const existing = await QueuePermissions.findOne({}, { where: ctx.params }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await Queue.checkNamespaceLimits(
    0,
    cpu - existing.cpu,
    isPreemptible,
    memory - existing.memory,
    existing.namespaceId as any,
  );

  const result = await QueuePermissions.update(
    existing,
    ctx.request.body,
    ctx.params,
    ctx.state.user,
  );
  const record = await QueuePermissions.read(result, user);

  ctx.response.body = { record };
}
