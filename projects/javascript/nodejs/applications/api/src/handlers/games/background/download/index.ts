import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Game, GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { populate } = GamePermissions.accessControl.options;
  const game = await Game.findOne({ _id: ctx.params._id }).populate(populate);
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = GamePermissions.accessControl.getFieldPermissions(
    'read',
    game,
    ctx.state.apiKey || ctx.state.user,
  );
  if (!permissions.includes('background')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, game.getMinioKey('background'));
  const stream = await minio.getObject(bucket, game.getMinioKey('background'));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
