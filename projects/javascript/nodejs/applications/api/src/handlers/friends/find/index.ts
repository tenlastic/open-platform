import { Context } from '@tenlastic/web-server';

import { FriendPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await FriendPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
