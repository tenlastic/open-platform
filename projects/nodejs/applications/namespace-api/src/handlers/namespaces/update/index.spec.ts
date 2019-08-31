import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';

import { NamespaceMock, NamespaceDocument } from '../../../models';
import { handler } from '../update';

const chance = new Chance();

describe('handlers/namespaces/update', function() {
  let record: NamespaceDocument;
  let user: any;

  beforeEach(async function() {
    record = await NamespaceMock.create();
    user = { roles: ['Admin'] };
  });

  it('updates an existing record', async function() {
    const ctx = new ContextMock({
      params: {
        id: record._id,
      },
      request: {
        body: {
          name: chance.hash(),
        },
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
