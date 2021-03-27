import {
  QueueMock,
  NamespaceQueueLimitsMock,
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

describe('handlers/queues/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['queues'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 0.1,
            gameServerTemplate: {},
            memory: 0.1,
            name: chance.hash(),
            namespaceId: namespace._id,
            teams: 2,
            usersPerTeam: 1,
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the queues.count Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['queues'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ count: 1 }),
        }),
        users: [namespaceUser],
      });
      await QueueMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 0.1,
            memory: 0.1,
            namespaceId: namespace._id,
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.count. Value: 1.');
    });

    it('enforces the queues.cpu Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ cpu: 0.1 }),
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

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.cpu. Value: 0.1.');
    });

    it('enforces the queues.memory Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ memory: 0.1 }),
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

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: queues.memory. Value: 0.1.',
      );
    });

    it('enforces the queues.preemptible Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ preemptible: true }),
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
        'Namespace limit reached: queues.preemptible. Value: true.',
      );
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
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
