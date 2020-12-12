import * as minio from '@tenlastic/minio';
import {
  GameDocument,
  GameMock,
  NamespaceDocument,
  NamespaceGameLimitsMock,
  NamespaceLimitError,
  NamespaceLimitsMock,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as FormData from 'form-data';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/games/videos/upload', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let ctx: ContextMock;
    let form: FormData;
    let game: GameDocument;
    let namespace: NamespaceDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['games'],
      });
      namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          games: NamespaceGameLimitsMock.create({ size: 50 * 1000 * 1000 }),
        }),
        users: [namespaceUser],
      });
      game = await GameMock.create({ namespaceId: namespace._id });

      form = new FormData();
      form.append('valid', 'valid', { contentType: 'video/mp4', filename: 'valid.mp4' });

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
        state: { user: user.toObject() },
      } as any);
    });

    it('updates the record', async function() {
      await handler(ctx as any);

      const { videos } = ctx.response.body.record;
      expect(videos[0]).to.include(`http://localhost:3000/games/${game._id}/videos`);
    });

    it('uploads file to Minio', async function() {
      await handler(ctx as any);

      const { videos } = ctx.response.body.record;
      const _id = videos[0].replace(`http://localhost:3000/games/${game._id}/videos/`, '');
      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        game.getMinioKey('videos', _id),
      );

      expect(result).to.exist;
    });

    it('does not allow large files', async function() {
      namespace.limits.games.size = 1;
      namespace.markModified('limits');
      await namespace.save();

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: games.size. Value: 1.');
    });

    it('does not allow invalid mimetypes', async function() {
      form.append('invalid', 'invalid', { contentType: 'video/x-icon', filename: 'invalid.ico' });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Mimetype must be: video/mp4.');
    });

    it('does not allow too many videos', async function() {
      game.videos.push(chance.hash());
      await game.save();

      namespace.limits.games.videos = 1;
      namespace.markModified('limits');
      await namespace.save();

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();
      const game = await GameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: {
          _id: game._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
