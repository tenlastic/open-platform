import { Context } from '@tenlastic/web-server';

import { MatchPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await MatchPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
