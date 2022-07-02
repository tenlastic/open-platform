import * as minio from '@tenlastic/minio';
import { Game, GamePermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, gameId } = ctx.params;

  const { populate } = GamePermissions.accessControl.options;
  const game = await Game.findOne({ _id: gameId }).populate(populate);
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = GamePermissions.accessControl.getFieldPermissions(
    'read',
    game,
    ctx.state.apiKey || ctx.state.user,
  );
  if (!permissions.includes('images')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, game.getMinioKey('images', _id));
  const stream = await minio.getObject(bucket, game.getMinioKey('images', _id));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
