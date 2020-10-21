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
  NamespaceRolesMock,
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
      const namespaceRoles = NamespaceRolesMock.create({
        roles: ['Administrator'],
        userId: user._id,
      });
      const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
      const queue = await QueueMock.create({ namespaceId: namespace._id });

      await GameInvitationMock.create({ namespaceId: namespace._id, toUserId: user._id });

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

      const namespaceRoles = NamespaceRolesMock.create({
        roles: ['Administrator'],
        userId: user._id,
      });
      const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
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
