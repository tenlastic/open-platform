import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { ExampleMock, ExampleDocument } from '../../../models';
import { handler } from '../find-one';

describe('handlers/users/find-one', function() {
  let record: ExampleDocument;
  let user: any;

  beforeEach(async function() {
    record = await ExampleMock.create();
    user = { roles: ['Admin'] };
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
