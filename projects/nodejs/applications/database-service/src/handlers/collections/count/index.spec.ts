import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';

import { CollectionMock } from '../../../models';
import { handler } from '../count';

describe('handlers/collections/count', function() {
  let user: any;

  beforeEach(async function() {
    await CollectionMock.create();
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
