import { Context, RecordNotFoundError } from '@tenlastic/api-module';

import { UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await UserPermissions.findOne({}, query, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError();
  }

  ctx.response.body = { record: result };
}
