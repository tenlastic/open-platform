import {
  NamespaceDocument,
  NamespaceMock,
  NamespaceUserMock,
  QueueDocument,
  QueueMock,
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

describe('handlers/queues/update', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let namespace: NamespaceDocument;
    let record: QueueDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['queues'],
      });

      namespace = await NamespaceMock.create({ users: [namespaceUser] });
      record = await QueueMock.create({ namespaceId: namespace._id });
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

    it('enforces the queues.cpu Namespace limit', async function() {
      namespace.limits.queues.cpu = 0.1;
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

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.cpu. Value: 0.1.');
    });

    it('enforces the queues.memory Namespace limit', async function() {
      namespace.limits.queues.memory = 0.1;
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
        'Namespace limit reached: queues.memory. Value: 0.1.',
      );
    });

    it('enforces the queues.preemptible Namespace limit', async function() {
      namespace.limits.queues.preemptible = true;
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
        'Namespace limit reached: queues.preemptible. Value: true.',
      );
    });
  });

  context('when permission is denied', function() {
    let record: QueueDocument;

    beforeEach(async function() {
      const namespace = await NamespaceMock.create();
      record = await QueueMock.create({ namespaceId: namespace._id });
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
