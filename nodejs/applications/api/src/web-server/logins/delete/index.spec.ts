import { RefreshTokenDocument, RefreshTokenModel, UserModel } from '@tenlastic/mongoose';
import { Context, ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from '.';

use(chaiAsPromised);

describe('web-server/logins/delete', function () {
  let ctx: Context;
  let refreshToken: RefreshTokenDocument;

  beforeEach(async function () {
    refreshToken = await RefreshTokenModel.mock().save();
    await UserModel.mock({ password: 'password' }).save();

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
    const result = await RefreshTokenModel.findOne({ _id: refreshToken._id });

    expect(result).to.eql(null);
  });
});
