import { Group, User } from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/groups/leave', function () {
  it('returns the record', async function () {
    const otherUser = await User.mock().save();
    const user = await User.mock().save();
    const record = await Group.mock({ isOpen: true, userIds: [user._id, otherUser._id] }).save();

    const ctx = new ContextMock({
      params: {
        _id: record._id,
      },
      state: { user: otherUser.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record.userIds).to.not.include(otherUser._id.toString());
  });
});
