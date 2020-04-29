import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { UserMock, UserDocument } from '../../../models';
import { handler } from '.';

describe('handlers/users/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({ roles: ['Administrator'] });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
