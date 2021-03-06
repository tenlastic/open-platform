import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { GroupMock, UserMock } from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/groups/kick', function() {
  it('returns the record', async function() {
    const otherUser = await UserMock.create();
    const user = await UserMock.create();
    const record = await GroupMock.create({ isOpen: true, userIds: [user._id, otherUser._id] });

    const ctx = new ContextMock({
      params: {
        _id: record._id,
        userId: otherUser._id,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record.userIds).to.not.include(otherUser._id.toString());
  });
});
