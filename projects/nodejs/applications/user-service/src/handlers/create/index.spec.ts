import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';
import * as Chance from 'chance';

import { UserMock, UserDocument } from '../../models';
import { handler } from '.';

const chance = new Chance();

describe('create', function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it('creates a new record', async function() {
    const ctx = new ContextMock({
      request: {
        body: {
          email: chance.email(),
          password: chance.hash(),
          username: chance.hash({ length: 20 }),
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
