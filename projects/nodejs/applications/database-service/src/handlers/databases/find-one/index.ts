import { Context, RestController } from '@tenlastic/api-module';

import { Database, DatabaseDocument, DatabaseModel, DatabasePermissions } from '../../../models';

const restController = new RestController<DatabaseDocument, DatabaseModel, DatabasePermissions>(
  Database,
  new DatabasePermissions(),
);

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await restController.findOne(query, ctx.state.user);

  ctx.response.body = { record: result };
}
