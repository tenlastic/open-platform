import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import {
  QueueDocument,
  QueueMock,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/queues/update', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: QueueDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
      const game = await GameMock.create({ namespaceId: namespace._id });

      record = await QueueMock.create({ gameId: game._id });
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
  });

  context('when permission is denied', function() {
    let record: QueueDocument;

    beforeEach(async function() {
      const game = await GameMock.create();
      record = await QueueMock.create({ gameId: game._id });
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
