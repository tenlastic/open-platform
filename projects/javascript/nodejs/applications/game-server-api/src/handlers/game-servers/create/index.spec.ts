import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/game-servers/create', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            gameId: game._id,
          },
        },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await ReadonlyNamespaceMock.create();
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            gameId: game._id,
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
