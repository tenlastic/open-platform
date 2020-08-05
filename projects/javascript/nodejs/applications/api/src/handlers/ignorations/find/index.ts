import { Context } from '@tenlastic/web-server';

import { IgnorationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await IgnorationPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
