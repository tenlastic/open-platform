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

describe('handlers/games/images/upload', function() {
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
        state: { user: user.toObject() },
      } as any);
    });

    it('updates the record', async function() {
      await handler(ctx as any);

      const { images } = ctx.response.body.record;
      expect(images[0]).to.include(`http://localhost:3000/games/${game._id}/images`);
    });

    it('uploads file to Minio', async function() {
      await handler(ctx as any);

      const { images } = ctx.response.body.record;
      const _id = images[0].replace(`http://localhost:3000/games/${game._id}/images/`, '');
      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        game.getMinioKey('images', _id),
      );

      expect(result).to.exist;
    });

    it('does not allow large files', async function() {
      namespace.limits.games.size = 1;
      namespace.markModified('limits');
      await namespace.save();

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Filesize must be smaller than 1B.');
    });

    it('does not allow invalid mimetypes', async function() {
      form.append('invalid', 'invalid', { contentType: 'image/x-icon', filename: 'invalid.ico' });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Mimetype must be: image/gif, image/jpeg, image/png.',
      );
    });

    it('does not allow too many images', async function() {
      game.images.push(chance.hash());
      await game.save();

      namespace.limits.games.images = 1;
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
