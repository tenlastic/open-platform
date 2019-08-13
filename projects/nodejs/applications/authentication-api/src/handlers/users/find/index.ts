import { Context } from '@tenlastic/web-server';

import { UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await UserPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
