import { Context } from '@tenlastic/web-server';

import { CollectionPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await CollectionPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
