import { Context } from '@tenlastic/web-server';

import { RefreshTokenPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await RefreshTokenPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
