import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Example, ExamplePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await ExamplePermissions.where({ _id: ctx.params.id }, ctx.state.user);
  const record = await Example.findOne(where).populate(
    ExamplePermissions.accessControl.options.populate,
  );

  if (!record) {
    throw new RecordNotFoundError('Example');
  }

  const result = await ExamplePermissions.update(record, ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
