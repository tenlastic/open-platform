import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import {
  GameInvitationMock,
  NamespaceMock,
  QueueMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/queue-members/create', function() {
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
      const queue = await QueueMock.create({ namespaceId: namespace._id, usersPerTeam: 1 });

      await GameInvitationMock.create({ namespaceId: namespace._id, userId: user._id });

      const ctx = new ContextMock({
        request: {
          body: {
            queueId: queue._id,
            userId: user._id,
          },
        },
        state: { jwt: { jti: mongoose.Types.ObjectId().toHexString() }, user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const otherUser = await UserMock.create();

      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['queues'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      const queue = await QueueMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            queueId: queue._id,
            userId: user._id,
          },
        },
        state: {
          jwt: { jti: mongoose.Types.ObjectId().toHexString() },
          user: otherUser.toObject(),
        },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
