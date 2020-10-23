import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Game, GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await GamePermissions.where(
    { _id: ctx.params._id },
    ctx.state.apiKey || ctx.state.user,
  );
  const record = await Game.findOne(where).populate(GamePermissions.accessControl.options.populate);

  if (!record) {
    throw new RecordNotFoundError('Game');
  }

  const result = await GamePermissions.update(
    record,
    ctx.request.body,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { record: result };
}
