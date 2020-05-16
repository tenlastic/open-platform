import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { GroupMock, GroupInvitationMock, UserDocument, UserMock } from '../../../models';
import { handler } from './';

describe('handlers/group-invitations/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const group = await GroupMock.create({ userIds: [user._id] });
    await GroupInvitationMock.create({ groupId: group._id, toUserId: user._id });
    await GroupInvitationMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});