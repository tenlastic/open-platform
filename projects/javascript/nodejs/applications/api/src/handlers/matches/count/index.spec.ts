import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { MatchMock, UserDocument, UserMock } from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/matches/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    await MatchMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
