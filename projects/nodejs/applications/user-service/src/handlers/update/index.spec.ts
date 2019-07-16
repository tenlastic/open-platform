import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';
import * as Chance from 'chance';

import { UserMock, UserDocument } from '../../models';
import { handler } from '.';

const chance = new Chance();

describe('update', function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it('updates an existing record', async function() {
    const ctx = new ContextMock({
      request: {
        body: {
          email: chance.email(),
          level: user.level + 1,
        },
      },
      params: {
        id: record._id,
      },
      state: {
        user,
      },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
