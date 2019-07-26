import { Context, ContextMock } from '@tenlastic/api-module';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  RefreshToken,
  RefreshTokenDocument,
  RefreshTokenMock,
  UserDocument,
  UserMock,
} from '../../../models';
import { handler } from '.';

use(chaiAsPromised);

describe('handlers/logins/delete', function() {
  let ctx: Context;
  let refreshToken: RefreshTokenDocument;
  let user: UserDocument;

  beforeEach(async function() {
    refreshToken = await RefreshTokenMock.create();
    user = await UserMock.create({ activatedAt: new Date(), password: 'password' });

    ctx = new ContextMock({
      request: {
        body: {
          email: user.email,
          password: 'password',
        },
        headers: {},
      },
      state: {
        jwt: {
          jti: refreshToken.jti,
        },
      },
    }) as any;

    await handler(ctx);
  });

  it('returns a 200 status code', async function() {
    expect(ctx.response.status).to.eql(200);
  });

  it('deletes the associated RefreshToken', async function() {
    const result = await RefreshToken.findOne({ jti: refreshToken.jti });

    expect(result).to.eql(null);
  });
});
