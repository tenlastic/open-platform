import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';

import { DatabaseMock, DatabaseDocument } from '../../../models';
import { handler } from '../delete';

describe('handlers/databases/delete', function() {
  let record: DatabaseDocument;
  let user: any;

  beforeEach(async function() {
    record = await DatabaseMock.create();
    user = { roles: ['Admin'] };
  });

  it('returns the deleted record', async function() {
    const ctx = new ContextMock({
      params: {
        id: record._id,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
