import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Game, GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;
  const game = await GamePermissions.findOne({}, { where: { _id: ctx.params._id } }, user);
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = await GamePermissions.getFieldPermissions('read', game, user);
  if (!permissions.includes('icon')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, game.getMinioKey('icon'));
  const stream = await minio.getObject(bucket, game.getMinioKey('icon'));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
