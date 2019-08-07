import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';

import { CollectionMock, CollectionDocument } from '../../../models';
import { handler } from './';

describe('handlers/collections/delete', function() {
  let record: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    record = await CollectionMock.create();
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
