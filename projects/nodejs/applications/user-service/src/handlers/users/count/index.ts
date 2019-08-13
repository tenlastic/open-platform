import { Context } from '@tenlastic/api-module';

import { User, UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await UserPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
