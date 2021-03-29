import {
  DatabaseMock,
  NamespaceDatabaseLimitsMock,
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

describe('handlers/databases/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      const ctx = new ContextMock({
        request: {
          body: {
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

    it('enforces the databases.count Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ count: 1 }),
        }),
        users: [namespaceUser],
      });
      await DatabaseMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 0.1,
            memory: 0.1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.count. Value: 1.',
      );
    });

    it('enforces the databases.cpu Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ cpu: 0.1 }),
        }),
        users: [namespaceUser],
      });

      const ctx = new ContextMock({
        request: {
          body: {
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
        'Namespace limit reached: databases.cpu. Value: 0.1.',
      );
    });

    it('enforces the databases.memory Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ memory: 0.1 }),
        }),
        users: [namespaceUser],
      });

      const ctx = new ContextMock({
        request: {
          body: {
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
        'Namespace limit reached: databases.memory. Value: 0.1.',
      );
    });

    it('enforces the databases.preemptible Namespace limit', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ preemptible: true }),
        }),
        users: [namespaceUser],
      });

      const ctx = new ContextMock({
        request: {
          body: {
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
        'Namespace limit reached: databases.preemptible. Value: true.',
      );
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
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
