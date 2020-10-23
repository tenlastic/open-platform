import { Context } from '@tenlastic/web-server';

import { ExamplePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ExamplePermissions.count(
    ctx.request.query.where,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { count: result };
}
