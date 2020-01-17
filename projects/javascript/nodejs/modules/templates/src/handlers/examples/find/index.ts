import { Context } from '@tenlastic/web-server';

import { ExamplePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ExamplePermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
