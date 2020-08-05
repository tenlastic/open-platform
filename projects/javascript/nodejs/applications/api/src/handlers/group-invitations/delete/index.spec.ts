import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  GroupMock,
  GroupInvitationDocument,
  GroupInvitationMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/group-invitations/delete', function() {
  let otherUser: UserDocument;
  let user: UserDocument;

  beforeEach(async function() {
    otherUser = await UserMock.create();
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: GroupInvitationDocument;

    beforeEach(async function() {
      const group = await GroupMock.create({ userIds: [user._id] });
      record = await GroupInvitationMock.create({ groupId: group._id, toUserId: otherUser._id });
    });

    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: otherUser.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let record: GroupInvitationDocument;

    beforeEach(async function() {
      const group = await GroupMock.create({ userIds: [user._id] });
      record = await GroupInvitationMock.create({ groupId: group._id, toUserId: user._id });
    });

    it('throws an error', async function() {
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
