import { Context, RecordNotFoundError } from '@tenlastic/api-module';

import { DatabasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params.id } };
  const result = await DatabasePermissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError();
  }

  ctx.response.body = { record: result };
}
