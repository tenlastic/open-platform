import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { cpu, memory, namespaceId, preemptible, replicas } = ctx.request.body;
  if (!cpu || !memory || !namespaceId || !replicas) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId', 'replicas']);
  }

  await Queue.checkNamespaceLimits(null, cpu, memory, namespaceId, preemptible || false, replicas);

  const credentials = { ...ctx.state };
  const result = await QueuePermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await QueuePermissions.read(credentials, result);

  ctx.response.body = { record };
}
