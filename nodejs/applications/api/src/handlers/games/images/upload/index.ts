import * as minio from '@tenlastic/minio';
import { Game, GamePermissions, NamespaceLimitError } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const game = await GamePermissions.findOne({}, { where: { _id: ctx.params._id } }, user);
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const permissions = await GamePermissions.getFieldPermissions('update', game, user);
  if (!permissions.includes('images')) {
    throw new PermissionError();
  }

  const limits = game.namespaceDocument.limits.games;
  const fileSize = limits.size || Infinity;

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
        busboy.emit('error', new NamespaceLimitError('games.size', limits.size)),
      );

      minio.putObject(process.env.MINIO_BUCKET, path, stream, { 'content-type': mimetype });
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  const host = ctx.request.host.replace('api', 'cdn');
  const urls = paths.map((p) => game.getUrl(host, ctx.request.protocol, p));
  if (limits.images > 0 && game.images.length + urls.length > limits.images) {
    throw new NamespaceLimitError('games.images', limits.images);
  }

  const result = await Game.findOneAndUpdate({ _id: game._id }, { $addToSet: { images: urls } });
  const record = await GamePermissions.read(result, user);

  ctx.response.body = { record };
}
