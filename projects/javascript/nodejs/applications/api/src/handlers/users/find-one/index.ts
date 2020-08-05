import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { UserPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await UserPermissions.findOne({}, query, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('User');
  }

  ctx.response.body = { record: result };
}
