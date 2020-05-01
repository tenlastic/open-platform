import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { RefreshTokenMock, UserDocument, UserMock } from '../../../models';
import { handler } from './';

describe('handlers/refresh-tokens/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    await RefreshTokenMock.create({ userId: user._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});