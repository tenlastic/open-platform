import { Context } from '@tenlastic/web-server';

import { LogPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await LogPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
