import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  QueueMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
  GameInvitationMock,
  QueueMemberMock,
  QueueMemberDocument,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/queue-members/delete', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: QueueMemberDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['queues'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      const queue = await QueueMock.create({ namespaceId: namespace._id });

      await GameInvitationMock.create({ namespaceId: namespace._id, toUserId: user._id });
      record = await QueueMemberMock.create({ queueId: queue._id, userId: user._id });
    });

    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let record: QueueMemberDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['queues'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      const queue = await QueueMock.create({ namespaceId: namespace._id });

      await GameInvitationMock.create({ namespaceId: namespace._id, toUserId: user._id });
      record = await QueueMemberMock.create({ queueId: queue._id, userId: user._id });
    });

    it('throws an error', async function() {
      const otherUser = await UserMock.create();

      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: otherUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
