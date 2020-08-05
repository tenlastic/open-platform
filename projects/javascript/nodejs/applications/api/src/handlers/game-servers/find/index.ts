import { Context } from '@tenlastic/web-server';

import { GameServerPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await GameServerPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
