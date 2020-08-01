import { Context } from '@tenlastic/web-server';

import { QueuePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await QueuePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
