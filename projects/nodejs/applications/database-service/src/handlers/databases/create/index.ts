import { Context } from '@tenlastic/api-module';

import { DatabasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await DatabasePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
