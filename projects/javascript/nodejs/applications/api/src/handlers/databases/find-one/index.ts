import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { DatabasePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { name: ctx.params.name } };
  const result = await DatabasePermissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('Database');
  }

  ctx.response.body = { record: result };
}
