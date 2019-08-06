import { Context, RestController } from '@tenlastic/api-module';

import { Example, ExamplePermissions } from '../../../models';

const restController = new RestController(Example, new ExamplePermissions());

export async function handler(ctx: Context) {
  const result = await restController.remove(ctx.params.id, ctx.state.user);

  ctx.response.body = { record: result };
}
