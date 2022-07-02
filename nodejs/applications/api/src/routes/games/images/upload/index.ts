import * as minio from '@tenlastic/minio';
import { Game, GamePermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

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

  // Parse files from request body.
  const paths: string[] = [];
  await new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', (field, stream, filename, encoding, mimetype) => {
      const path = game.getMinioKey('images');
      paths.push(path);

      // Make sure the file is an image.
      if (mimetype !== 'image/gif' && mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        busboy.emit('error', new Error('Mimetype must be: image/gif, image/jpeg, image/png.'));
        return;
      }

      minio.putObject(process.env.MINIO_BUCKET, path, stream, { 'content-type': mimetype });
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  const host = ctx.request.host.replace('api', 'cdn');
  const urls = paths.map((p) => game.getUrl(host, ctx.request.protocol, p));

  const result = await Game.findOneAndUpdate({ _id: game._id }, { $addToSet: { images: urls } });
  const record = await GamePermissions.read(result, user);

  ctx.response.body = { record };
}
