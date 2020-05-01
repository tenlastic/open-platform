import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { UserDocument, UserMock } from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/refresh-tokens/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  it('creates a new record', async function() {
    const ctx = new ContextMock({
      request: {
        body: {},
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.refreshToken).to.exist;
  });
});