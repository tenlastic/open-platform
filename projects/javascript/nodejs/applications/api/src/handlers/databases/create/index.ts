import { Database, DatabasePermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, memory, namespaceId, preemptible, replicas, storage } = ctx.request.body;
  if (!cpu || !memory || !namespaceId || !replicas || !storage) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId', 'replicas', 'storage']);
  }

  await Database.checkNamespaceLimits(
    null,
    cpu,
    memory,
    namespaceId,
    preemptible || false,
    replicas,
    storage,
  );

  const result = await DatabasePermissions.create(ctx.request.body, ctx.params, user);
  const record = await DatabasePermissions.read(result, user);

  ctx.response.body = { record };
}
