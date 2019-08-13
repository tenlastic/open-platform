import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';

import { ExampleMock, ExampleDocument } from '../../../models';
import { handler } from '../update';

const chance = new Chance();

describe('handlers/users/update', function() {
  let record: ExampleDocument;
  let user: any;

  beforeEach(async function() {
    record = await ExampleMock.create();
    user = { roles: ['Admin'] };
  });

  it('updates an existing record', async function() {
    const ctx = new ContextMock({
      params: {
        id: record._id,
      },
      request: {
        body: {},
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
