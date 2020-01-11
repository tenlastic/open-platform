import { Context } from '@tenlastic/web-server';

import { GamePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await GamePermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
