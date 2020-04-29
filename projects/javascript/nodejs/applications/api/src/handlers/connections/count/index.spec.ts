import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { ConnectionMock, ConnectionDocument } from '../../../models';
import { handler } from '.';

describe('handlers/connections/count', function() {
  let user: ConnectionDocument;

  beforeEach(async function() {
    user = await ConnectionMock.create();
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
