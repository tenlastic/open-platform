import { Context } from '@tenlastic/web-server';

import { FriendPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await FriendPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
