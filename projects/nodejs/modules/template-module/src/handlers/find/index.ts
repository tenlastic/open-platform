import { Context, RestController } from '@tenlastic/api-module';

import { Example, ExampleDocument, ExampleModel, ExamplePermissions } from '../../../models';

const restController = new RestController<ExampleDocument, ExampleModel, ExamplePermissions>(
  Example,
  new ExamplePermissions(),
);

export async function handler(ctx: Context) {
  const result = await restController.find(ctx.request.query, ctx.state.user);

  ctx.response.body = { records: result };
}
