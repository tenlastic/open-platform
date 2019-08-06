import { Context, RestController } from '@tenlastic/api-module';

import { Database, DatabasePermissions } from '../../../models';

const restController = new RestController(Database, new DatabasePermissions());

export async function handler(ctx: Context) {
  const result = await restController.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
