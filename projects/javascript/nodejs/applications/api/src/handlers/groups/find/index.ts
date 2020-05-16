import { Context } from '@tenlastic/web-server';

import { GroupPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await GroupPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
