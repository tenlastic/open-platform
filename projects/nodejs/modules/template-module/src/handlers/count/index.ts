import { Context, RestController } from '@tenlastic/api-module';

import { Example, ExampleDocument, ExampleModel, ExamplePermissions } from '../../../models';

const restController = new RestController<ExampleDocument, ExampleModel, ExamplePermissions>(
  Example,
  new ExamplePermissions(),
);

export async function handler(ctx: Context) {
  const result = await restController.count(ctx.request.query.where, ctx.state.user);

  ctx.response.body = { count: result };
}
