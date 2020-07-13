import { Context } from '@tenlastic/web-server';

import { LogPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await LogPermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
