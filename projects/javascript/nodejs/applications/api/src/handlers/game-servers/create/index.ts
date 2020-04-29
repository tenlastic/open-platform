import { Context } from '@tenlastic/web-server';

import { GameServerPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await GameServerPermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
