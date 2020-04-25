import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from '.';

use(chaiAsPromised);

describe('handlers/miscellaneous/public-keys', function() {
  it('returns the access and refresh tokens', async function() {
    const ctx: any = new ContextMock();
    const publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n')
      .replace(/\n/g, '')
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '');

    await handler(ctx);

    expect(ctx.response.body.keys.length).to.eql(1);
    expect(ctx.response.body.keys[0].alg).to.eql('RS256');
    expect(ctx.response.body.keys[0].kwt).to.eql('RSA');
    expect(ctx.response.body.keys[0].use).to.eql('sig');
    expect(ctx.response.body.keys[0].x5c.length).to.eql(1);
    expect(ctx.response.body.keys[0].x5c[0]).to.eql(publicKey);
  });
});
