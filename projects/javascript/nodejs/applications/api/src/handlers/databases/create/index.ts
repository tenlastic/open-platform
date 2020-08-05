import { Context } from '@tenlastic/web-server';

import { DatabasePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await DatabasePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
