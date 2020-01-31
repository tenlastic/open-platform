import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { ReadonlyUserDocument, ReadonlyUserMock } from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/friends/create', function() {
  let fromUser: ReadonlyUserDocument;
  let toUser: ReadonlyUserDocument;

  beforeEach(async function() {
    fromUser = await ReadonlyUserMock.create();
    toUser = await ReadonlyUserMock.create();
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
