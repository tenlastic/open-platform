import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as Chance from 'chance';
import * as chaiAsPromised from 'chai-as-promised';

import {
  GameMock,
  GameServerMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  UserRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/logs/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
      const game = await GameMock.create({ namespaceId: namespace._id });
      const gameServer = await GameServerMock.create({ gameId: game._id });

      const ctx = new ContextMock({
        request: {
          body: {
            body: chance.hash(),
            gameServerId: gameServer._id,
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const gameServer = await GameServerMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
            body: chance.hash(),
            gameServerId: gameServer._id,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
