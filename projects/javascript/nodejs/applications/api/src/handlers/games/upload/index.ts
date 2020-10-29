import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as Busboy from 'busboy';

import { Game, GameDocument, GamePermissions } from '@tenlastic/mongoose-models';

interface FieldPath {
  field: string;
  path: string;
}

export async function handler(ctx: Context) {
  const game = await Game.findOne({ _id: ctx.params._id });
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  // Get permissions for the Game
  const populatedGame = await game
    .populate(GamePermissions.accessControl.options.populate)
    .execPopulate();
  const permissions = GamePermissions.accessControl.getFieldPermissions(
    'update',
    populatedGame,
    ctx.state.apiKey || ctx.state.user,
  );

  // Parse files from request body.
  const fields: FieldPath[] = [];
  const promises: Array<Promise<FieldPath>> = [];
  await new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: ctx.request.headers });

    busboy.on('error', reject);
    busboy.on('file', (field, stream, filename, encoding, mimetype) => {
      const promise = fileHandler(field, game, permissions, stream, mimetype);
      promises.push(promise);
    });
    busboy.on('finish', resolve);

    ctx.req.pipe(busboy);
  });

  for (const promise of promises) {
    const result = await promise;
    fields.push(result);
  }

  const fieldPaths = fields.reduce((previous, current) => {
    const host = ctx.request.host.replace('api', 'cdn');
    previous[current.field] = game.getUrl(host, ctx.request.protocol, current.path);
    return previous;
  }, {});

  ctx.response.body = fieldPaths;
}

async function fileHandler(
  field: string,
  game: GameDocument,
  permissions: string[],
  stream: NodeJS.ReadableStream,
  mimetype: string,
) {
  if (!permissions.includes(field)) {
    throw new PermissionError();
  }

  const path = game.getMinioPath(field);
  await minio.putObject(process.env.MINIO_BUCKET, path, stream, { 'content-type': mimetype });

  return { field, path } as FieldPath;
}
