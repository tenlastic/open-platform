import { Context, RestController } from '@tenlastic/api-module';

import { Collection, CollectionPermissions } from '../../../models';

const restController = new RestController(Collection, new CollectionPermissions());

export async function handler(ctx: Context) {
  ctx.request.query.databaseId = ctx.params.databaseId;

  const result = await restController.find(ctx.request.query, ctx.state.user);

  ctx.response.body = { records: result };
}
