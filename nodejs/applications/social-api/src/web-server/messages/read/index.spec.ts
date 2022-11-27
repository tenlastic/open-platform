import { Message, MessageDocument, User, UserDocument } from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/message/read', function () {
  let firstUser: UserDocument;
  let secondUser: UserDocument;
  let user: UserDocument;

  beforeEach(async function () {
    firstUser = await User.mock().save();
    secondUser = await User.mock().save();
    user = await User.mock().save();
  });

  context('when permission is granted', function () {
    let record: MessageDocument;

    beforeEach(async function () {
      record = await Message.mock({ fromUserId: user._id, toUserId: firstUser._id }).save();
    });

    it('returns the record', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: firstUser.toObject() },
      });

      await handler(ctx as any);

      const readByUserIds = ctx.response.body.record.readByUserIds.map((id) => id.toString());
      expect(readByUserIds).to.include(firstUser._id.toString());
    });
  });

  context('when permission is denied', function () {
    let record: MessageDocument;

    beforeEach(async function () {
      record = await Message.mock({ fromUserId: user._id, toUserId: firstUser._id }).save();
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: secondUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
