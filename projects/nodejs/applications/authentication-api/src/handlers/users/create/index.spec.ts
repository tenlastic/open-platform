import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';

import { User, UserMock, UserDocument } from '../../../models';
import { handler } from '.';

const chance = new Chance();

describe('handlers/users/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({ roles: ['Admin'] });
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
