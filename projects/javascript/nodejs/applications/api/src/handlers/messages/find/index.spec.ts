import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { MessageMock, UserDocument, UserMock } from '../../../models';
import { handler } from './';

describe('handlers/messages/find', function() {
  let fromUser: UserDocument;

  beforeEach(async function() {
    fromUser = await UserMock.create();
    const toUser = await UserMock.create();

    await MessageMock.create({ fromUserId: fromUser._id, toUserId: toUser._id });
    await MessageMock.create({ fromUserId: toUser._id, toUserId: fromUser._id });
    await MessageMock.create({
      fromUserId: mongoose.Types.ObjectId(),
      toUserId: mongoose.Types.ObjectId(),
    });
  });

  it('returns the matching records', async function() {
    const ctx = new ContextMock({
      state: { user: fromUser.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(2);
  });
});
