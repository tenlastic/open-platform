import { Group, GroupDocument, User, UserDocument } from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/groups/join', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await User.mock().save();
  });

  context('when permission is granted', function () {
    let record: GroupDocument;

    beforeEach(async function () {
      record = await Group.mock({ isOpen: true, userIds: [user._id] }).save();
    });

    it('returns the record', async function () {
      const otherUser = await User.mock().save();
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: otherUser.toObject() },
      });

      await handler(ctx as any);

      const userIds = ctx.response.body.record.userIds.map((u) => u.toString());
      expect(userIds).to.include(otherUser._id.toString());
    });
  });

  context('when permission is denied', function () {
    let otherUser: UserDocument;
    let record: GroupDocument;

    beforeEach(async function () {
      otherUser = await User.mock({}).save();
      record = await Group.mock({ isOpen: false, userIds: [user._id, otherUser._id] }).save();
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: otherUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
