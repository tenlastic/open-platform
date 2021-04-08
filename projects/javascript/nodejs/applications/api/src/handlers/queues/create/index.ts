import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';
import { RequiredFieldError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, isPreemptible, memory, namespaceId, replicas } = ctx.request.body;
  if (!cpu || !memory || !namespaceId || !replicas) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId', 'replicas']);
  }

  await Queue.checkNamespaceLimits(
    null,
    cpu,
    isPreemptible || false,
    memory,
    namespaceId,
    replicas,
  );

  const result = await QueuePermissions.create(ctx.request.body, ctx.params, user);
  const record = await QueuePermissions.read(result, user);

  ctx.response.body = { record };
}
