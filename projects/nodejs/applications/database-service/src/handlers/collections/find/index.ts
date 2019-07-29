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
  const result = await restController.find(ctx.request.query, ctx.state.user);

  ctx.response.body = { records: result };
}
