import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';

import { DatabaseMock } from '../../../models';
import { handler } from './';

describe('handlers/databases/count', function() {
  let user: any;

  beforeEach(async function() {
    await DatabaseMock.create();
    user = { roles: ['Admin'] };
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
