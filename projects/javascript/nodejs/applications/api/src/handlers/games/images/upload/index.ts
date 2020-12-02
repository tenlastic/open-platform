import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

import { Game, GamePermissions, NamespaceLimitError } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const { populate } = GamePermissions.accessControl.options;
  const game = await Game.findOne({ _id: ctx.params._id }).populate(populate);
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = GamePermissions.accessControl.getFieldPermissions('update', game, user);
  if (!permissions.includes('images')) {
    throw new PermissionError();
  }

  const fileSize = game.namespaceDocument.limits.games.size || 50 * 1000 * 1000;

  // Parse files from request body.
  const paths: string[] = [];
  await new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers, limits: { fileSize } });

    busboy.on('error', reject);
    busboy.on('file', (field, stream, filename, encoding, mimetype) => {
      const path = game.getMinioKey('images');
      paths.push(path);

      // Make sure the file is an image.
      if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        busboy.emit('error', new Error('Mimetype must be: image/gif, image/jpeg, image/png.'));
        return;
      }

      // Make sure the file is a valid size.
      stream.on('limit', () =>
        busboy.emit('error', new Error(`Filesize must be smaller than ${fileSize}B.`)),
      );

      minio.putObject(process.env.MINIO_BUCKET, path, stream, { 'content-type': mimetype });
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  const host = ctx.request.host.replace('api', 'cdn');
  const urls = paths.map(p => game.getUrl(host, ctx.request.protocol, p));
  if (
    game.namespaceDocument.limits.games.images > 0 &&
    game.images.length + urls.length > game.namespaceDocument.limits.games.images
  ) {
    throw new NamespaceLimitError('games.images');
  }

  const result = await Game.findOneAndUpdate({ _id: game._id }, { $addToSet: { images: urls } });
  const record = await GamePermissions.read(result, user);

  ctx.response.body = { record };
}
