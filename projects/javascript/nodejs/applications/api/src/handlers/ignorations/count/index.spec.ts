import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { IgnorationMock, UserDocument, UserMock } from '../../../models';
import { handler } from './';

describe('handlers/ignorations/count', function() {
  let fromUser: UserDocument;

  beforeEach(async function() {
    fromUser = await UserMock.create();
    const toUser = await UserMock.create();

    await IgnorationMock.create({ fromUserId: fromUser._id, toUserId: toUser._id });
    await IgnorationMock.create({ fromUserId: toUser._id, toUserId: fromUser._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: fromUser.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
