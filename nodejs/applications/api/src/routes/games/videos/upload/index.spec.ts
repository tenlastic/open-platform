import * as minio from '@tenlastic/minio';
import {
  GameDocument,
  GameMock,
  NamespaceDocument,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';

import { handler } from './';

use(chaiAsPromised);

describe('routes/games/videos/upload', function () {
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
      const namespaceUser = NamespaceUserMock.create({ _id: user._id, roles: ['games'] });
      namespace = await NamespaceMock.create({ users: [namespaceUser] });
      game = await GameMock.create({ namespaceId: namespace._id });

      form = new FormData();
      form.append('valid', 'valid', { contentType: 'video/mp4', filename: 'valid.mp4' });

      ctx = new ContextMock({
        params: { _id: game._id },
        req: form,
        request: { headers: form.getHeaders(), host: 'localhost:3000', protocol: 'http' },
        state: { user: user.toObject() },
      } as any);
    });

    it('updates the record', async function () {
      await handler(ctx as any);

      const { videos } = ctx.response.body.record;
      expect(videos[0]).to.include(`http://localhost:3000/games/${game._id}/videos`);
    });

    it('uploads file to Minio', async function () {
      await handler(ctx as any);
      await new Promise((res) => setTimeout(res, 100));

      const { videos } = ctx.response.body.record;
      const _id = videos[0].replace(`http://localhost:3000/games/${game._id}/videos/`, '');
      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        game.getMinioKey('videos', _id),
      );

      expect(result).to.exist;
    });

    it('does not allow invalid mimetypes', async function () {
      form.append('invalid', 'invalid', { contentType: 'video/x-icon', filename: 'invalid.ico' });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Mimetype must be: video/mp4.');
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();
      const game = await GameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: { _id: game._id },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
