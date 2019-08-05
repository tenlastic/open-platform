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
  ctx.request.query.where = ctx.request.query.where || {};
  ctx.request.query.where.databaseId = ctx.params.databaseId;

  const result = await restController.count(ctx.request.query.where, ctx.state.user);

  ctx.response.body = { count: result };
}
