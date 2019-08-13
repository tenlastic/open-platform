import { Context } from '@tenlastic/web-server';

import { UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await UserPermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
