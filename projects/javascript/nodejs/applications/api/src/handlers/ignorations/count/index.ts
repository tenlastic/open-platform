import { Context } from '@tenlastic/web-server';

import { IgnorationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await IgnorationPermissions.count(
    ctx.request.query.where,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { count: result };
}
