import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { WebSocketMock, WebSocketDocument } from '@tenlastic/mongoose-models';
import { handler } from '.';

describe('handlers/web-sockets/find-one', function() {
  let record: WebSocketDocument;
  let user: any;

  beforeEach(async function() {
    record = await WebSocketMock.create();
    user = { roles: ['Administrator'] };
  });

  it('returns the matching record', async function() {
    const ctx = new ContextMock({
      params: {
        id: record._id,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.id).to.eql(record.id);
  });
});
