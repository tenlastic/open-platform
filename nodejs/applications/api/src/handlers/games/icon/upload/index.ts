import * as minio from '@tenlastic/minio';
import { Game, GamePermissions, NamespaceLimitError } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const game = await GamePermissions.findOne(credentials, { where: { _id: ctx.params._id } }, {});
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = await GamePermissions.getFieldPermissions(credentials, 'update', game);
  if (!permissions.includes('icon')) {
    throw new PermissionError();
  }

  const limits = game.namespaceDocument.limits.games;
  const fileSize = limits.size || Infinity;
  const path = game.getMinioKey('icon');

  // Parse files from request body.
  await new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: ctx.request.headers,
      limits: { fileSize },
    });

    busboy.on('error', reject);
    busboy.on('file', (field, stream, filename, encoding, mimetype) => {
      // Make sure the file is an image.
      if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        busboy.emit('error', new Error('Mimetype must be: image/gif, image/jpeg, image/png.'));
        return;
      }

      // Make sure the file is a valid size.
      stream.on('limit', () =>
        busboy.emit('error', new NamespaceLimitError('games.size', limits.size)),
      );

      minio.putObject(process.env.MINIO_BUCKET, path, stream, { 'content-type': mimetype });
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  const host = ctx.request.host.replace('api', 'cdn');
  const url = game.getUrl(host, ctx.request.protocol, path);

  const result = await Game.findOneAndUpdate({ _id: game._id }, { icon: url });
  const record = await GamePermissions.read(credentials, result);

  ctx.response.body = { record };
}
