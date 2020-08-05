import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { GroupDocument, GroupMock, UserDocument, UserMock } from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/groups/find-one', function() {
  let record: GroupDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    record = await GroupMock.create({ userIds: [user._id] });
  });

  it('returns the record', async function() {
    const ctx = new ContextMock({
      params: {
        _id: record._id,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
