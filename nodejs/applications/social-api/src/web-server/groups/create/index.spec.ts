import { User, UserDocument } from '../../../mongodb';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('web-server/groups/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await User.mock();
  });

  it('creates a new record', async function () {
    const ctx = new ContextMock({
      request: { body: {} },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
