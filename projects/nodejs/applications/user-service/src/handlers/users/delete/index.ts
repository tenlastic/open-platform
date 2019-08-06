import { Context, RestController } from '@tenlastic/api-module';

import { User, UserPermissions } from '../../../models';

const restController = new RestController(User, new UserPermissions());

export async function handler(ctx: Context) {
  const result = await restController.remove(ctx.params.id, ctx.state.user);

  ctx.response.body = { record: result };
}
