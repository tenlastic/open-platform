import { Context } from '@tenlastic/web-server';

import { QueueMemberPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await QueueMemberPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
