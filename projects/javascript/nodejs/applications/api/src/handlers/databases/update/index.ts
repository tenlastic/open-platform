import { Database, DatabasePermissions } from '@tenlastic/mongoose-models';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const existing = await DatabasePermissions.findOne({}, { where: ctx.params }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  await Database.checkNamespaceLimits(
    existing._id,
    ctx.request.body.cpu || existing.cpu,
    ctx.request.body.isPreemptible || existing.isPreemptible,
    ctx.request.body.memory || existing.memory,
    existing.namespaceId,
    ctx.request.body.replicas || existing.replicas,
    ctx.request.body.storage || existing.storage,
  );

  const result = await DatabasePermissions.update(
    existing,
    ctx.request.body,
    ctx.params,
    ctx.state.user,
  );
  const record = await DatabasePermissions.read(result, user);

  ctx.response.body = { record };
}
