import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { MessageDocument, MessageMock, UserDocument, UserMock } from '../../../mongodb';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/message/read', function () {
  let firstUser: UserDocument;
  let secondUser: UserDocument;
  let user: UserDocument;

  beforeEach(async function () {
    firstUser = await UserMock.create();
    secondUser = await UserMock.create();
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let record: MessageDocument;

    beforeEach(async function () {
      record = await MessageMock.create({ fromUserId: user._id, toUserId: firstUser._id });
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
      record = await MessageMock.create({ fromUserId: user._id, toUserId: firstUser._id });
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