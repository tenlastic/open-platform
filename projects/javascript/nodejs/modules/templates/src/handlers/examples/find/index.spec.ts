import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { ExampleMock } from '../../../models';
import { handler } from '../find';

describe('handlers/users/find', function() {
  let user: any;

  beforeEach(async function() {
    await ExampleMock.create();
    user = { roles: ['Admin'] };
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
