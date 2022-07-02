import { UserDocument, UserMock } from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('routes/groups/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  it('creates a new record', async function () {
    const ctx = new ContextMock({
      request: { body: {} },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
