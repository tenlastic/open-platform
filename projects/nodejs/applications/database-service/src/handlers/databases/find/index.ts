import { Context } from '@tenlastic/api-module';

import { DatabasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await DatabasePermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
