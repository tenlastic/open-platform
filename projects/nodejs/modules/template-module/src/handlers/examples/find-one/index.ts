import { Context, RestController } from '@tenlastic/api-module';

import { Example, ExamplePermissions } from '../../../models';

const restController = new RestController(Example, new ExamplePermissions());

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await restController.findOne(query, ctx.state.user);

  ctx.response.body = { record: result };
}
