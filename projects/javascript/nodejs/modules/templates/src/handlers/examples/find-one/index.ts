import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ExamplePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params.id } };
  const result = await ExamplePermissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('Example');
  }

  ctx.response.body = { record: result };
}
