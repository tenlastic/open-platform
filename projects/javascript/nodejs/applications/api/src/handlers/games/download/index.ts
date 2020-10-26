import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Game, GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const game = await Game.findOne({ _id: ctx.params._id });
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  const { field, fileId } = ctx.params;

  try {
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
  } catch (e) {
    console.log(JSON.stringify(e.stack));
    throw e;
  }

  const bucket = process.env.MINIO_BUCKET;
  console.log('Field: ' + field);
  console.log('Bucket: ' + bucket);
  const info = await minio.statObject(bucket, game.getMinioPath(field, fileId));
  const stream = await minio.getObject(bucket, game.getMinioPath(field, fileId));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
