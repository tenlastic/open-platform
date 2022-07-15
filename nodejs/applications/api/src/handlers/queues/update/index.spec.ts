import {
  AuthorizationMock,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceMock,
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

describe('handlers/queues/update', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let namespace: NamespaceDocument;
    let record: QueueDocument;

    beforeEach(async function () {
      namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.QueuesReadWrite],
        userId: user._id,
      });

      record = await QueueMock.create({ namespaceId: namespace._id });
    });

    it('returns the record', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the Namespace limits', async function () {
      namespace.limits.queues.cpu = 1;
      namespace.markModified('limits');
      await namespace.save();

      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            cpu: 2,
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.cpu. Value: 1.');
    });
  });

  context('when permission is denied', function () {
    let record: QueueDocument;

    beforeEach(async function () {
      const namespace = await NamespaceMock.create();
      record = await QueueMock.create({ namespaceId: namespace._id });
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
