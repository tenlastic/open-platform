import { Context } from '@tenlastic/web-server';

import { MatchPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await MatchPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
