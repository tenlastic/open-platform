import { Context, RestController } from '@tenlastic/api-module';

import { Collection, CollectionPermissions } from '../../../models';

const restController = new RestController(Collection, new CollectionPermissions());

export async function handler(ctx: Context) {
  const result = await restController.create(
    ctx.request.body,
    { databaseId: ctx.params.databaseId },
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
