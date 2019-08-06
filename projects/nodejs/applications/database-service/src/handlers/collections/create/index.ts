import { Context, RestController } from '@tenlastic/api-module';

import { Collection, CollectionPermissions } from '../../../models';

const restController = new RestController(Collection, new CollectionPermissions());

export async function handler(ctx: Context) {
  const override = { databaseId: ctx.params.databaseId };

  const result = await restController.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
