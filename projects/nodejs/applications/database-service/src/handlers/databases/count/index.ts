import { Context } from '@tenlastic/api-module';

import { DatabasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await DatabasePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
