import { Context, ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { RefreshToken, RefreshTokenDocument, User } from '../../../mongodb';
import { handler } from '.';

use(chaiAsPromised);

describe('web-server/logins/delete', function () {
  let ctx: Context;
  let refreshToken: RefreshTokenDocument;

  beforeEach(async function () {
    refreshToken = await RefreshToken.mock();
    await User.mock({ password: 'password' });

    ctx = new ContextMock({
      state: {
        jwt: {
          jti: refreshToken._id.toString(),
        },
      },
    }) as any;

    await handler(ctx);
  });

  it('returns a 200 status code', async function () {
    expect(ctx.response.status).to.eql(200);
  });

  it('deletes the associated RefreshToken', async function () {
    const result = await RefreshToken.findOne({ _id: refreshToken._id });

    expect(result).to.eql(null);
  });
});
