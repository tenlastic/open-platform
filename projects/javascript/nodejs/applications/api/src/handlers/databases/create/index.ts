import { Database, DatabasePermissions } from '@tenlastic/mongoose-models';
import { RequiredFieldError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { cpu, isPreemptible, memory, namespaceId, replicas, storage } = ctx.request.body;
  if (!cpu || !memory || !namespaceId || !replicas || !storage) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId', 'replicas', 'storage']);
  }

  await Database.checkNamespaceLimits(
    null,
    cpu,
    isPreemptible || false,
    memory,
    namespaceId,
    replicas,
    storage,
  );

  const result = await DatabasePermissions.create(ctx.request.body, ctx.params, user);
  const record = await DatabasePermissions.read(result, user);

  ctx.response.body = { record };
}
