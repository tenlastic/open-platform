import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { WebSocketMock, WebSocketDocument } from '@tenlastic/mongoose-models';
import { handler } from '.';

describe('handlers/connections/find', function() {
  let user: WebSocketDocument;

  beforeEach(async function() {
    user = await WebSocketMock.create();
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
