import * as minio from '@tenlastic/minio';
import {
  AuthorizationMock,
  AuthorizationRole,
  GameDocument,
  GameMock,
  NamespaceDocument,
  NamespaceGameLimitsMock,
  NamespaceLimitError,
  NamespaceLimitsMock,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/games/icon/upload', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
    let form: FormData;
    let game: GameDocument;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          games: NamespaceGameLimitsMock.create({ size: 50 * 1000 * 1000 }),
        }),
      });
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GamesReadWrite],
        userId: user._id,
      });
      game = await GameMock.create({ namespaceId: namespace._id });

      form = new FormData();
      form.append('valid', 'valid', { contentType: 'image/jpeg', filename: 'valid.jpg' });

      ctx = new ContextMock({
        params: {
          _id: game._id,
        },
        req: form,
        request: {
          headers: form.getHeaders(),
          host: 'localhost:3000',
          protocol: 'http',
        },
        state: { user },
      } as any);
    });

    it('creates a new record', async function () {
      await handler(ctx as any);

      expect(ctx.response.body.record.icon).to.eql(`http://localhost:3000/games/${game._id}/icon`);
    });

    it('uploads file to Minio', async function () {
      await handler(ctx as any);
      await new Promise((res) => setTimeout(res, 100));

      const result = await minio.statObject(process.env.MINIO_BUCKET, game.getMinioKey('icon'));

      expect(result).to.exist;
    });

    it('does not allow large files', async function () {
      namespace.limits.games.size = 1;
      namespace.markModified('limits');
      await namespace.save();

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });

    it('does not allow invalid mimetypes', async function () {
      form.append('invalid', 'invalid', { contentType: 'image/x-icon', filename: 'invalid.ico' });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Mimetype must be: image/gif, image/jpeg, image/png.',
      );
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();
      const game = await GameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: {
          _id: game._id,
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
