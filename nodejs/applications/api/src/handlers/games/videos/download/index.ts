import * as minio from '@tenlastic/minio';
import { Game, GamePermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, gameId } = ctx.params;

  const user = ctx.state.apiKey || ctx.state.user;
  const game = await GamePermissions.findOne({}, { where: { _id: gameId } }, user);
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = await GamePermissions.getFieldPermissions('read', game, user);
  if (!permissions.includes('videos')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, game.getMinioKey('videos', _id));
  const stream = await minio.getObject(bucket, game.getMinioKey('videos', _id));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
