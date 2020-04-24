import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from '.';

use(chaiAsPromised);

describe('handlers/miscellaneous/public-keys', function() {
  it('returns the access and refresh tokens', async function() {
    const ctx: any = new ContextMock();

    await handler(ctx);

    expect(ctx.response.body.algorithm).to.eql('rs256');
    expect(ctx.response.body.key).to.eql(process.env.JWT_PUBLIC_KEY);
  });
});
