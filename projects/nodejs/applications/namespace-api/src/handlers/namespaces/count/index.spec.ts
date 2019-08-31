import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { NamespaceMock } from '../../../models';
import { handler } from '.';

describe('handlers/namespaces/count', function() {
  let user: any;

  beforeEach(async function() {
    await NamespaceMock.create();
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
