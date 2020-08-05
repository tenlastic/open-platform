import { Context } from '@tenlastic/web-server';

import { NamespacePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await NamespacePermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
