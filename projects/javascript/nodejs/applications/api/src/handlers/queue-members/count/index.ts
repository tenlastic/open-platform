import { Context } from '@tenlastic/web-server';

import { QueueMemberPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await QueueMemberPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
