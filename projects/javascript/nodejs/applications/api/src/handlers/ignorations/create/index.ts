import { Context } from '@tenlastic/web-server';

import { IgnorationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await IgnorationPermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
