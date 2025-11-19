import { ContextMock, CreateContext } from '@tenlastic/web-server';
import { expect } from 'chai';
import { Chance } from 'chance';

import { UserDocument } from '@tenlastic/mongoose';
import { handler } from '.';

const chance = new Chance();

describe('web-server/users/create', function () {
  it('creates a new record', async function () {
    const ctx = ContextMock<CreateContext<UserDocument>>({
      request: {
        body: {
          email: chance.email(),
          password: chance.hash(),
          username: chance.hash({ length: 20 }),
        },
      },
    });

    await handler(ctx);

    expect(ctx.response.body.record).to.exist;
  });
});
