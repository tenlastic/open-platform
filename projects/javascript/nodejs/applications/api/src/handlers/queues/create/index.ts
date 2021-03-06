import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, memory, namespaceId, preemptible, replicas } = ctx.request.body;
  if (!cpu || !memory || !namespaceId || !replicas) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId', 'replicas']);
  }

  await Queue.checkNamespaceLimits(null, cpu, memory, namespaceId, preemptible || false, replicas);

  const result = await QueuePermissions.create(ctx.request.body, ctx.params, user);
  const record = await QueuePermissions.read(result, user);

  ctx.response.body = { record };
}
