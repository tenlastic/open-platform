import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GameServer, GameServerPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await GameServerPermissions.where({ _id: ctx.params._id }, ctx.state.user);
  const record = await GameServer.findOne(where).populate(
    GameServerPermissions.accessControl.options.populate,
  );

  if (!record) {
    throw new RecordNotFoundError('Game Server');
  }

  const result = await GameServerPermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
