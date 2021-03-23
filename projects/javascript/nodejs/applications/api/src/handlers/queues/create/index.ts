import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';
import { RequiredFieldError } from '@tenlastic/web-server';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { namespaceId } = ctx.request.body;
  if (!namespaceId) {
    throw new RequiredFieldError(['namespaceId']);
  }

  await Queue.checkNamespaceLimits(1, namespaceId);

  const result = await QueuePermissions.create(ctx.request.body, ctx.params, user);
  const record = await QueuePermissions.read(result, user);

  ctx.response.body = { record };
}
