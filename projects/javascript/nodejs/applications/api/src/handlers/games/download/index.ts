import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { MINIO_BUCKET } from '../../../constants';
import { Game, GamePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const game = await Game.findOne({ _id: ctx.params._id });
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  const { field, fileId } = ctx.params;

  // Get permissions for the Game
  const populatedGame = await game
    .populate(GamePermissions.accessControl.options.populate)
    .execPopulate();
  const permissions = GamePermissions.accessControl.getFieldPermissions(
    'read',
    populatedGame,
    ctx.state.user,
  );
  if (!permissions.includes(field)) {
    throw new PermissionError();
  }

  const info = await minio.statObject(MINIO_BUCKET, game.getMinioPath(field, fileId));
  const stream = (await minio.getObject(MINIO_BUCKET, game.getMinioPath(field, fileId))) as any;

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
