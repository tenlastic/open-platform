import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { MessageDocument, MessageMock, UserDocument, UserMock } from '../../../mongodb';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/message/read', function () {
  let otherUser: UserDocument;
  let user: UserDocument;

  beforeEach(async function () {
    otherUser = await UserMock.create();
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let record: MessageDocument;

    beforeEach(async function () {
      record = await MessageMock.create({ fromUserId: user._id, toUserId: otherUser._id });
    });

    it('returns the record', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: otherUser.toObject() },
      });

      await handler(ctx as any);

      const readByUserIds = ctx.response.body.record.readByUserIds.map((id) => id.toString());
      expect(readByUserIds).to.include(otherUser._id.toString());
    });
  });

  context('when permission is denied', function () {
    let record: MessageDocument;

    beforeEach(async function () {
      record = await MessageMock.create({ fromUserId: user._id, toUserId: user._id });
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: otherUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
