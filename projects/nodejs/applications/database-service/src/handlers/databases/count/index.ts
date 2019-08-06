import { Context, RestController } from '@tenlastic/api-module';

import { Database, DatabasePermissions } from '../../../models';

const restController = new RestController(Database, new DatabasePermissions());

export async function handler(ctx: Context) {
  const result = await restController.count(ctx.request.query.where, ctx.state.user);

  ctx.response.body = { count: result };
}
