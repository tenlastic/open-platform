import * as minio from '@tenlastic/minio';
import {
  GameMock,
  NamespaceMock,
  UserMock,
  AuthorizationMock,
  AuthorizationRole,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as fs from 'fs';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/games/images/download', function () {
  it('returns a stream with the requested file', async function () {
    const user = await UserMock.create();
    const namespace = await NamespaceMock.create();
    await AuthorizationMock.create({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.GamesRead],
      userId: user._id,
    });
    const game = await GameMock.create({ namespaceId: namespace._id });

    // Upload test file to Minio.
    const _id = chance.hash();
    await minio.putObject(
      process.env.MINIO_BUCKET,
      game.getMinioKey('images', _id),
      fs.createReadStream(__filename),
    );

    const ctx = new ContextMock({
      params: {
        _id,
        gameId: game._id,
      },
      state: { user: user.toObject() },
    } as any);

    await handler(ctx as any);

    expect(ctx.response.body).to.exist;
  });
});
