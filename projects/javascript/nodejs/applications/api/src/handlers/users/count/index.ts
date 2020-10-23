import { Context } from '@tenlastic/web-server';

import { User, UserPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await UserPermissions.count(
    ctx.request.query.where,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { count: result };
}
