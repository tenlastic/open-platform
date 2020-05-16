import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { GroupDocument, GroupMock, UserDocument, UserMock } from '../../../models';
import { handler } from './';

describe('handlers/groups/find', function() {
  let record: GroupDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    record = await GroupMock.create({ userIds: [user._id] });
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
