import { Context } from '@tenlastic/web-server';

import { NamespacePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await NamespacePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
