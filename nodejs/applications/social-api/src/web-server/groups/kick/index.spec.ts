import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { Group, User } from '../../../mongodb';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/groups/kick', function () {
  it('returns the record', async function () {
    const otherUser = await User.mock();
    const user = await User.mock();
    const record = await Group.mock({ isOpen: true, userIds: [user._id, otherUser._id] });

    const ctx = new ContextMock({
      params: {
        _id: record._id,
        userId: otherUser._id,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record.userIds).to.not.include(otherUser._id.toString());
  });
});
