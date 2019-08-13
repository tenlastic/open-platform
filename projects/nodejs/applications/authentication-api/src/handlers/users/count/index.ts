import { Context } from '@tenlastic/web-server';

import { User, UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await UserPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
