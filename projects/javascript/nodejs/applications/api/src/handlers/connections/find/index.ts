import { Context } from '@tenlastic/web-server';

import { ConnectionPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ConnectionPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
