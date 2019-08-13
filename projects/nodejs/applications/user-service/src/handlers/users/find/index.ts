import { Context } from '@tenlastic/api-module';

import { UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await UserPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
