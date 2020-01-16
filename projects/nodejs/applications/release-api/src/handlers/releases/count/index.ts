import { Context } from '@tenlastic/web-server';

import { ReleasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ReleasePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
