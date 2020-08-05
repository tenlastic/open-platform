import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  GroupMock,
  GroupInvitationDocument,
  GroupInvitationMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/group-invitations/find', function() {
  let record: GroupInvitationDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const group = await GroupMock.create({ userIds: [user._id] });
    record = await GroupInvitationMock.create({ groupId: group._id, toUserId: user._id });
    await GroupInvitationMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
