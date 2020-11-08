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
            cpu: 0.1,
            memory: 0.1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the gameServers.count Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ count: 1 }),
        }),
        users: [namespaceUser],
      });
      await GameServerMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: new mongoose.Types.ObjectId(),
            cpu: 0.1,
            memory: 0.1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: gameServers.count.');
    });

    it('enforces the gameServers.cpu Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ cpu: 0.1 }),
        }),
        users: [namespaceUser],
      });

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: new mongoose.Types.ObjectId(),
            cpu: 0.2,
            memory: 0.1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: gameServers.cpu.');
    });

    it('enforces the gameServers.memory Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ memory: 0.1 }),
        }),
        users: [namespaceUser],
      });

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: new mongoose.Types.ObjectId(),
            cpu: 0.1,
            memory: 0.2,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: gameServers.memory.');
    });

    it('enforces the gameServers.preemptible Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ preemptible: true }),
        }),
        users: [namespaceUser],
      });

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: new mongoose.Types.ObjectId(),
            cpu: 0.2,
            memory: 0.1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.preemptible.',
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
            cpu: 0.1,
            memory: 0.1,
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
