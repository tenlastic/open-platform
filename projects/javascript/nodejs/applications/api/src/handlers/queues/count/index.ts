import { Context } from '@tenlastic/web-server';

import { QueuePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await QueuePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
