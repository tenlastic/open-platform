import {
  AuthorizationMock,
  AuthorizationRole,
  GameMock,
  NamespaceGameLimitsMock,
  NamespaceLimitsMock,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/games/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    it('creates a new record', async function () {
      const namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GamesReadWrite],
        userId: user._id,
      });

      const ctx = new ContextMock({
        request: {
          body: {
            namespaceId: namespace._id,
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the games.count Namespace limit', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          games: NamespaceGameLimitsMock.create({ count: 1 }),
        }),
      });
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GamesReadWrite],
        userId: user._id,
      });
      await GameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            namespaceId: namespace._id,
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: games.count. Value: 1.');
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
            namespaceId: namespace._id,
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
