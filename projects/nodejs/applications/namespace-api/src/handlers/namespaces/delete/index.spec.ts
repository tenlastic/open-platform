import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { NamespaceMock, NamespaceDocument } from '../../../models';
import { handler } from '.';

describe('handlers/namespaces/delete', function() {
  let record: NamespaceDocument;
  let user: any;

  beforeEach(async function() {
    record = await NamespaceMock.create();
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
