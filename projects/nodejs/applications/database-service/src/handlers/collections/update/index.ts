import { Context, RestController } from '@tenlastic/api-module';

import {
  Collection,
  CollectionDocument,
  CollectionModel,
  CollectionPermissions,
} from '../../../models';

const restController = new RestController<
  CollectionDocument,
  CollectionModel,
  CollectionPermissions
>(Collection, new CollectionPermissions());

export async function handler(ctx: Context) {
  const result = await restController.update(ctx.params.id, ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
