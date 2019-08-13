import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { CollectionMock, CollectionDocument } from '../../../models';
import { handler } from './';

describe('handlers/collections/find-one', function() {
  let record: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    record = await CollectionMock.create();
    user = { roles: ['Admin'] };
  });

  it('returns the matching record', async function() {
    const ctx = new ContextMock({
      params: {
        databaseId: record.databaseId,
        id: record._id,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.id).to.eql(record.id);
  });
});
