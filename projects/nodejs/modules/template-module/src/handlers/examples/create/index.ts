import { Context } from '@tenlastic/api-module';

import { ExamplePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ExamplePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
