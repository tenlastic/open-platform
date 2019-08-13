import { Context, RecordNotFoundError } from '@tenlastic/api-module';

import { Example, ExamplePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const record = await Example.findOne({ _id: ctx.params.id }).populate(
    ExamplePermissions.populateOptions,
  );

  if (!record) {
    throw new RecordNotFoundError();
  }

  const result = await ExamplePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
