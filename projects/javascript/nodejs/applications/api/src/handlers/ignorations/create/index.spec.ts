import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { UserDocument, UserMock } from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/ignorations/create', function() {
  let fromUser: UserDocument;
  let toUser: UserDocument;

  beforeEach(async function() {
    fromUser = await UserMock.create();
    toUser = await UserMock.create();
  });

  it('creates a new record', async function() {
    const ctx = new ContextMock({
      request: {
        body: {
          fromUserId: fromUser._id,
          toUserId: toUser._id,
        },
      },
      state: { user: fromUser.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
