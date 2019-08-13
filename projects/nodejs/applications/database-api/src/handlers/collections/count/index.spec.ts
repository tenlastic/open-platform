import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { CollectionDocument, CollectionMock } from '../../../models';
import { handler } from './';

describe('handlers/collections/count', function() {
  let record: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    record = await CollectionMock.create();
    user = { roles: ['Admin'] };
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      params: { databaseId: record.databaseId },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
