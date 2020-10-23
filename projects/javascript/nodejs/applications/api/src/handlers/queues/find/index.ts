import { Context } from '@tenlastic/web-server';

import { QueuePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await QueuePermissions.find(
    ctx.request.query,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { records: result };
}
