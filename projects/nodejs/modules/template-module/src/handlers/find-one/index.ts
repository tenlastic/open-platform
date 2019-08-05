import { Context, RestController } from '@tenlastic/api-module';

import { Example, ExampleDocument, ExampleModel, ExamplePermissions } from '../../../models';

const restController = new RestController<ExampleDocument, ExampleModel, ExamplePermissions>(
  Example,
  new ExamplePermissions(),
);

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await restController.findOne(query, ctx.state.user);

  ctx.response.body = { record: result };
}
