import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';

import { UserMock, UserDocument } from '@tenlastic/mongoose-models';
import { handler } from '.';

const chance = new Chance();

describe('handlers/users/update', function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { roles: ['Administrator'] };
  });

  it('updates an existing record', async function() {
    const ctx = new ContextMock({
      params: {
        id: record._id,
      },
      request: {
        body: {
          email: chance.email(),
        },
      },
      state: {
        user,
      },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
