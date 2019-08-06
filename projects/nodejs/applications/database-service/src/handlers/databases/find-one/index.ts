import { Context, RestController } from '@tenlastic/api-module';

import { Database, DatabasePermissions } from '../../../models';

const restController = new RestController(Database, new DatabasePermissions());

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await restController.findOne(query, ctx.state.user);

  ctx.response.body = { record: result };
}
