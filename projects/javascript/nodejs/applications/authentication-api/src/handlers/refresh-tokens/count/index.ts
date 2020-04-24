import { Context } from '@tenlastic/web-server';

import { RefreshTokenPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await RefreshTokenPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
