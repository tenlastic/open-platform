import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { MessageMock, ReadonlyUserDocument, ReadonlyUserMock } from '../../../models';
import { handler } from './';

describe('handlers/messages/count', function() {
  let fromUser: ReadonlyUserDocument;

  beforeEach(async function() {
    fromUser = await ReadonlyUserMock.create();
    const toUser = await ReadonlyUserMock.create();

    await MessageMock.create({ fromUserId: fromUser._id, toUserIds: [toUser._id] });
    await MessageMock.create({ fromUserId: toUser._id, toUserIds: [fromUser._id] });
    await MessageMock.create({
      fromUserId: mongoose.Types.ObjectId(),
      toUserIds: [mongoose.Types.ObjectId()],
    });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: fromUser.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(2);
  });
});
