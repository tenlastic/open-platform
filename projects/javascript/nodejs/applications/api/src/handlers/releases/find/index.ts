import { Context } from '@tenlastic/web-server';

import { ReleasePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await ReleasePermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
