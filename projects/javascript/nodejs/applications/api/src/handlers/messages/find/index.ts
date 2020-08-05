import { Context } from '@tenlastic/web-server';

import { MessagePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await MessagePermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
