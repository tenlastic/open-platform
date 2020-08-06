import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as FormData from 'form-data';
import * as fs from 'fs';

import {
  GameDocument,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  UserRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/games/upload', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let ctx: ContextMock;
    let form: FormData;
    let game: GameDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
      game = await GameMock.create({ namespaceId: namespace._id });

      const stream = fs.createReadStream(__filename);

      form = new FormData();
      form.append('background', stream);

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

    it('creates a new record', async function() {
      await handler(ctx as any);

      expect(ctx.response.body.background).to.eql(
        `http://localhost:3000/games/${game._id}/background`,
      );
    });

    it('uploads file to Minio', async function() {
      await handler(ctx as any);

      const result = await minio.statObject(
        process.env.MINIO_BUCKET,
        game.getMinioPath('background'),
      );

      expect(result).to.exist;
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

      return expect(promise).to.be.rejected;
    });
  });
});
