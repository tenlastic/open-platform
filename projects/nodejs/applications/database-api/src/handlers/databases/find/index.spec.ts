import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { DatabaseMock } from '../../../models';
import { handler } from './';

describe('handlers/databases/find', function() {
  let user: any;

  beforeEach(async function() {
    await DatabaseMock.create();
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
