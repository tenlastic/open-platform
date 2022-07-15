import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const game = await GamePermissions.findOne(credentials, { where: { _id: ctx.params._id } }, {});
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = await GamePermissions.getFieldPermissions(credentials, 'read', game);
  if (!permissions.includes('icon')) {
    throw new PermissionError();
  }

  const bucket = process.env.MINIO_BUCKET;
  const info = await minio.statObject(bucket, game.getMinioKey('icon'));
  const stream = await minio.getObject(bucket, game.getMinioKey('icon'));

  ctx.response.body = stream;
  ctx.response.type = info.metaData['content-type'];
}
