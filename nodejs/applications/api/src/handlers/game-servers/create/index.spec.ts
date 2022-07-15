import {
  AuthorizationMock,
  AuthorizationRole,
  BuildMock,
  GameServerMock,
  NamespaceGameServerLimitsMock,
  NamespaceLimitsMock,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/game-servers/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    it('creates a new record', async function () {
      const namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GameServersReadWrite],
        userId: user._id,
      });
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: build._id,
            cpu: 1,
            memory: 100 * 1000 * 1000,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the Namespace limits', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ cpu: 1 }),
        }),
      });
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.BuildsReadWrite],
        userId: user._id,
      });
      await GameServerMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: new mongoose.Types.ObjectId(),
            cpu: 2,
            memory: 1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.cpu. Value: 1.',
      );
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: new mongoose.Types.ObjectId(),
            cpu: 1,
            memory: 1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
