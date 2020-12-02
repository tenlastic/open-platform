import * as minio from '@tenlastic/minio';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

import { GameMock, NamespaceMock, UserMock, NamespaceUserMock } from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/games/background/download', function() {
  it('returns a stream with the requested file', async function() {
    const user = await UserMock.create();
    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['games'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    const game = await GameMock.create({ namespaceId: namespace._id });

    // Upload test file to Minio.
    await minio.putObject(
      process.env.MINIO_BUCKET,
      game.getMinioKey('background'),
      fs.createReadStream(__filename),
    );

    const ctx = new ContextMock({
      params: {
        _id: game._id,
        field: 'background',
      },
      state: { user: user.toObject() },
    } as any);

    await handler(ctx as any);

    expect(ctx.response.body).to.exist;
  });
});
