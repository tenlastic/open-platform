import { Context } from '@tenlastic/web-server';

import { LogPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await LogPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
