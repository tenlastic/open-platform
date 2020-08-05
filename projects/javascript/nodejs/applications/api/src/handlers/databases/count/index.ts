import { Context } from '@tenlastic/web-server';

import { DatabasePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await DatabasePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
