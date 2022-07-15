import * as minio from '@tenlastic/minio';
import { GamePermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, gameId } = ctx.params;

  const credentials = { ...ctx.state };
  const game = await GamePermissions.findOne(credentials, { where: { _id: gameId } }, {});
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = await GamePermissions.getFieldPermissions(credentials, 'read', game);
  if (!permissions.includes('images')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, game.getMinioKey('images', _id));
  const stream = await minio.getObject(bucket, game.getMinioKey('images', _id));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
