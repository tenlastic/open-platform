import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { IgnorationMock, ReadonlyUserDocument, ReadonlyUserMock } from '../../../models';
import { handler } from './';

describe('handlers/ignorations/find', function() {
  let fromUser: ReadonlyUserDocument;

  beforeEach(async function() {
    fromUser = await ReadonlyUserMock.create();
    const toUser = await ReadonlyUserMock.create();

    await IgnorationMock.create({ fromUserId: fromUser._id, toUserId: toUser._id });
    await IgnorationMock.create({ fromUserId: toUser._id, toUserId: fromUser._id });
  });

  it('returns the matching records', async function() {
    const ctx = new ContextMock({
      state: { user: fromUser.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0].fromUserId.toString()).to.eql(fromUser._id.toString());
  });
});
