import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GamePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { name: ctx.params.name } };
  const result = await GamePermissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('Game');
  }

  ctx.response.body = { record: result };
}
