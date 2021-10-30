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

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/databases/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    it('creates a new record', async function () {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 1,
            memory: 250 * 1000 * 1000,
            name: chance.hash(),
            namespaceId: namespace._id,
            replicas: 1,
            storage: 5 * 1000 * 1000 * 1000,
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the Namespace limits', async function () {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ cpu: 1 }),
        }),
        users: [namespaceUser],
      });
      await DatabaseMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 1,
            memory: 1,
            name: chance.hash(),
            namespaceId: namespace._id,
            replicas: 2,
            storage: 1,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.cpu. Value: 1.',
      );
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 1,
            memory: 1,
            name: chance.hash(),
            namespaceId: namespace._id,
            replicas: 1,
            storage: 1,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
