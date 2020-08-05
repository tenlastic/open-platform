import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { ConnectionMock, ConnectionDocument } from '@tenlastic/mongoose-models';
import { handler } from '.';

describe('handlers/connections/find', function() {
  let user: ConnectionDocument;

  beforeEach(async function() {
    user = await ConnectionMock.create();
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
