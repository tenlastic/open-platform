import { Context } from '@tenlastic/web-server';

import { GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await GamePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
