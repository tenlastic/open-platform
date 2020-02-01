import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { IgnorationMock, ReadonlyUserDocument, ReadonlyUserMock } from '../../../models';
import { handler } from './';

describe('handlers/ignorations/count', function() {
  let fromUser: ReadonlyUserDocument;

  beforeEach(async function() {
    fromUser = await ReadonlyUserMock.create();
    const toUser = await ReadonlyUserMock.create();

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
