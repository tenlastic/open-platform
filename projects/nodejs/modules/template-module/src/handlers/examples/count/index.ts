import { Context } from '@tenlastic/api-module';

import { ExamplePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ExamplePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
