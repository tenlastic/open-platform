import { Context, RestController } from '@tenlastic/api-module';

import { Database, DatabaseDocument, DatabaseModel, DatabasePermissions } from '../../../models';

const restController = new RestController<DatabaseDocument, DatabaseModel, DatabasePermissions>(
  Database,
  new DatabasePermissions(),
);

export async function handler(ctx: Context) {
  const result = await restController.count(ctx.query.where, ctx.state.user);

  ctx.response.body = { count: result };
}
