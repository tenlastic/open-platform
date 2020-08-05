import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { ConnectionMock, ConnectionDocument } from '@tenlastic/mongoose-models';
import { handler } from '.';

describe('handlers/connections/find-one', function() {
  let record: ConnectionDocument;
  let user: any;

  beforeEach(async function() {
    record = await ConnectionMock.create();
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
