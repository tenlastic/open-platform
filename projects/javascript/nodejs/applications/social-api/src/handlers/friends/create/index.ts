import { Context } from '@tenlastic/web-server';

import { FriendPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await FriendPermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
