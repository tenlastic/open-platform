import { Context } from '@tenlastic/web-server';

import { NamespacePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await NamespacePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
