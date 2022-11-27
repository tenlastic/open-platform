import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { User, UserDocument } from '../../../mongodb';
import { handler } from '.';

use(chaiAsPromised);

describe('web-server/logins/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await User.mock({ password: 'password' });
  });

  context('when credentials are correct', function () {
    it('returns the access and refresh tokens', async function () {
      const ctx: any = new ContextMock({
        request: {
          body: {
            password: 'password',
            username: user.username,
          },
          headers: {},
        },
      });

      await handler(ctx);

      expect(ctx.response.body.accessToken).to.exist;
      expect(ctx.response.body.record).to.exist;
      expect(ctx.response.body.refreshToken).to.exist;
    });
  });

  context('when credentials are incorrect', function () {
    it('returns an error message', function () {
      const ctx: any = new ContextMock({
        request: {
          body: {
            password: 'wrong',
            username: user.username,
          },
          headers: {},
        },
      });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith('Invalid username or password.');
    });
  });
});
