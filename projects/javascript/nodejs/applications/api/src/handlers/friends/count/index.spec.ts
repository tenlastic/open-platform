import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { FriendMock, UserDocument, UserMock } from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/friends/count', function() {
  let fromUser: UserDocument;

  beforeEach(async function() {
    fromUser = await UserMock.create();
    const toUser = await UserMock.create();

    await FriendMock.create({ fromUserId: fromUser._id, toUserId: toUser._id });
    await FriendMock.create({ fromUserId: toUser._id, toUserId: fromUser._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: fromUser.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
