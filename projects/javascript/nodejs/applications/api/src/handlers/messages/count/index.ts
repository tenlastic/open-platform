import { Context } from '@tenlastic/web-server';

import { MessagePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await MessagePermissions.count(
    ctx.request.query.where,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { count: result };
}
