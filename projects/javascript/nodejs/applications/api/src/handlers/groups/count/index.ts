import { Context } from '@tenlastic/web-server';

import { GroupPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await GroupPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
