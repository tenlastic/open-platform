import { Context, RestController } from '@tenlastic/api-module';

import { Example, ExampleDocument, ExampleModel, ExamplePermissions } from '../../../models';

const restController = new RestController<ExampleDocument, ExampleModel, ExamplePermissions>(
  Example,
  new ExamplePermissions(),
);

export async function handler(ctx: Context) {
  const result = await restController.update(ctx.params.id, ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
