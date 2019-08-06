import { Context, RestController } from '@tenlastic/api-module';

import { User, UserPermissions } from '../../../models';

const restController = new RestController(User, new UserPermissions());

export async function handler(ctx: Context) {
  const result = await restController.count(ctx.request.query.where, ctx.state.user);

  ctx.response.body = { count: result };
}
