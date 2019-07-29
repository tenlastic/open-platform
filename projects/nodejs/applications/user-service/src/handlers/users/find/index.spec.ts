import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';

import { UserMock, UserDocument } from '../../../models';
import { handler } from '.';

describe('handlers/users/find', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({ roles: ['Admin'] });
  });

  it('returns the matching records', async function() {
    const ctx = new ContextMock({
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });
});
