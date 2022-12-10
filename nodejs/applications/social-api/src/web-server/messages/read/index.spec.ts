import {
  MessageDocument,
  MessageModel,
  MessageReadReceiptModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
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
    firstUser = await UserModel.mock().save();
    secondUser = await UserModel.mock().save();
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let record: MessageDocument;

    beforeEach(async function () {
      record = await MessageModel.mock({ fromUserId: user._id, toUserId: firstUser._id }).save();
    });

    it('returns the record', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: firstUser.toObject() },
      });

      await handler(ctx as any);

      const readReceipts = ctx.response.body.record.readReceipts.filter((rr) =>
        rr.userId.equals(firstUser._id),
      );
      expect(readReceipts.length).to.eql(1);
    });

    it('does not duplicate Users', async function () {
      record.readReceipts = [
        new MessageReadReceiptModel({ userId: user._id }),
        new MessageReadReceiptModel({ userId: firstUser._id }),
      ];
      await record.save();

      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: firstUser.toObject() },
      });

      await handler(ctx as any);

      const readReceipts = ctx.response.body.record.readReceipts.filter((rr) =>
        rr.userId.equals(firstUser._id),
      );
      expect(readReceipts.length).to.eql(1);
    });
  });

  context('when permission is denied', function () {
    let record: MessageDocument;

    beforeEach(async function () {
      record = await MessageModel.mock({ fromUserId: user._id, toUserId: firstUser._id }).save();
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
