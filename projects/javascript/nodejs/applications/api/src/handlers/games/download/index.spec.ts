import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

import {
  GameDocument,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/games/download', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', async function() {
    let ctx: ContextMock;
    let game: GameDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['games'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      game = await GameMock.create({ namespaceId: namespace._id });

      // Upload test file to Minio.
      await minio.putObject(
        process.env.MINIO_BUCKET,
        game.getMinioKey('background'),
        fs.createReadStream(__filename),
      );

      ctx = new ContextMock({
        params: {
          _id: game._id,
          field: 'background',
        },
        state: { user: user.toObject() },
      } as any);
    });

    it('returns a stream with the requested file', async function() {
      await handler(ctx as any);

      expect(ctx.response.body).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();
      const game = await GameMock.create();

      const ctx = new ContextMock({
        params: {
          _id: game._id,
          field: 'existentialism',
        },
        state: { user: user.toObject() },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'User does not have permission to perform this action.',
      );
    });
  });
});
