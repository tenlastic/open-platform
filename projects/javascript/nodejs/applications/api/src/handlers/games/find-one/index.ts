import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await GamePermissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('Game');
  }

  ctx.response.body = { record: result };
}
