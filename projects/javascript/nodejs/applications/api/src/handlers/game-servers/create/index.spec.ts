import {
  GameServerMock,
  NamespaceGameServerLimitsMock,
  NamespaceLimitsMock,
  NamespaceMock,
  NamespaceUserMock,
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

describe('handlers/game-servers/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

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
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the Namespace limits', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ cpu: 1 }),
        }),
        users: [namespaceUser],
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
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.cpu. Value: 1.',
      );
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
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
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
