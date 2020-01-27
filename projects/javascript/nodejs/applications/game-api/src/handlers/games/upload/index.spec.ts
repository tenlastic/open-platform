import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';

import { MINIO_BUCKET } from '../../../constants';
import {
  GameDocument,
  GameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/games/upload', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    let ctx: ContextMock;
    let form: FormData;
    let game: GameDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      game = await GameMock.create({ namespaceId: namespace._id });

      const stream = fs.createReadStream(__filename);

      form = new FormData();
      form.append('background', stream);

      ctx = new ContextMock({
        params: {
          slug: game.slug,
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

    it('creates a new record', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.background).to.eql(
        `http://localhost:3000/games/${game.slug}/background`,
      );
    });

    it('uploads file to Minio', async function() {
      await handler(ctx as any);

      const result = await minio
        .getClient()
        .statObject(MINIO_BUCKET, game.getMinioPath('background'));

      expect(result).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await ReadonlyNamespaceMock.create();
      const game = await GameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: {
          slug: game.slug,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
