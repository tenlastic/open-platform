import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

import { MINIO_BUCKET } from '../../../constants';
import {
  GameDocument,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/files/download', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', async function() {
    let ctx: ContextMock;
    let game: GameDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
      game = await GameMock.create({ namespaceId: namespace._id });

      // Upload test file to Minio.
      await minio
        .getClient()
        .putObject(MINIO_BUCKET, game.getMinioPath('background'), fs.createReadStream(__filename));

      ctx = new ContextMock({
        params: {
          field: 'background',
          slug: game.slug,
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
          field: 'existentialism',
          slug: game.slug,
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
