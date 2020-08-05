import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { MessageDocument, MessageMock, UserDocument, UserMock } from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/messages/delete', function() {
  let fromUser: UserDocument;
  let record: MessageDocument;
  let toUser: UserDocument;

  beforeEach(async function() {
    fromUser = await UserMock.create();
    toUser = await UserMock.create();

    record = await MessageMock.create({ fromUserId: fromUser._id, toUserId: toUser._id });
  });

  context('when permission is granted', function() {
    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: fromUser.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record.fromUserId.toString()).to.eql(fromUser._id.toString());
    });
  });

  context('when permission is denied', function() {
    it('returns a permission error', async function() {
      const ctx = new ContextMock({
        params: { _id: record._id },
        state: { user: toUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'User does not have permission to perform this action.',
      );
    });
  });
});
