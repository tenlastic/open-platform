import {
  DatabaseDocument,
  DatabaseMock,
  NamespaceDocument,
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

describe('handlers/databases/update', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let namespace: NamespaceDocument;
    let record: DatabaseDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });

      namespace = await NamespaceMock.create({ users: [namespaceUser] });
      record = await DatabaseMock.create({ namespaceId: namespace._id });
    });

    it('returns the record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the databases.cpu Namespace limit', async function() {
      namespace.limits.databases.cpu = 0.1;
      namespace.markModified('limits');
      await namespace.save();

      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            cpu: 0.2,
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
      namespace.limits.databases.memory = 0.1;
      namespace.markModified('limits');
      await namespace.save();

      const ctx = new ContextMock({
        request: {
          body: {
            memory: 0.2,
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
      namespace.limits.databases.preemptible = true;
      namespace.markModified('limits');
      await namespace.save();

      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            isPreemptible: false,
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
    let record: DatabaseDocument;

    beforeEach(async function() {
      const namespace = await NamespaceMock.create();
      record = await DatabaseMock.create({ namespaceId: namespace._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
