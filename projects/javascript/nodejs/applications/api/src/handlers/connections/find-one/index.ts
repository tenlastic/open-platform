import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ConnectionPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await ConnectionPermissions.findOne({}, query, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Connection');
  }

  ctx.response.body = { record: result };
}
