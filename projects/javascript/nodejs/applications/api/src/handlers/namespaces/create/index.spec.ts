import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { handler } from '.';

const chance = new Chance();

describe('handlers/namespaces/create', function() {
  let user: any;

  beforeEach(async function() {
    user = { _id: mongoose.Types.ObjectId(), roles: ['Administrator'] };
  });

  it('creates a new record', async function() {
    const ctx = new ContextMock({
      request: {
        body: {
          name: chance.hash(),
        },
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;

    const users = ctx.response.body.record.users[0];
    expect(users._id.toString()).to.eql(user._id.toString());
    expect(users.roles).to.eql(['namespaces']);
  });
});
