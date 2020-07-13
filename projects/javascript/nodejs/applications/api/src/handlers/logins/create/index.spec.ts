import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { UserDocument, UserMock } from '../../../models';
import { handler } from '.';

use(chaiAsPromised);

describe('handlers/logins/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({ password: 'password' });
  });

  context('when credentials are correct', function() {
    it('returns the access and refresh tokens', async function() {
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
      expect(ctx.response.body.refreshToken).to.exist;
    });
  });

  context('when credentials are incorrect', function() {
    it('returns an error message', function() {
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
