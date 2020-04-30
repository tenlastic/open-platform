import { Context } from '@tenlastic/web-server';

import { GameServerDocument, GameServerPermissions } from '../../../models';

export async function handler(ctx: Context) {
  let result: GameServerDocument;
  let portError: any;

  do {
    try {
      result = await GameServerPermissions.create(ctx.request.body, {}, ctx.state.user);
    } catch (e) {
      if (e.name === 'MongoError' && e.code === 11000 && e.keyPattern.port) {
        portError = e;
      } else {
        throw e;
      }
    }
  } while (portError);

  ctx.response.body = { record: result };
}
