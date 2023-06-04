import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import dependencies from '../../dependencies';
import { administratorAccessToken } from '../../';
import * as helpers from '../helpers';

const chance = new Chance();
use(chaiAsPromised);

describe('/nodejs/authentication/logins', function () {
  let password: string;
  let username: string;

  beforeEach(async function () {
    password = chance.hash();
    username = chance.hash({ length: 24 });

    await dependencies.userService.create({ password, username });
  });

  afterEach(async function () {
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteUser(username));
  });

  describe('login with credentials', function () {
    context('when password is valid', function () {
      it('returns an access and refresh token', async function () {
        const { accessToken, refreshToken } = await dependencies.loginService.createWithCredentials(
          username,
          password,
        );

        expect(accessToken).to.exist;
        expect(refreshToken).to.exist;
      });
    });

    context('when password is invalid', function () {
      it('throws an error', async function () {
        const promise = dependencies.loginService.createWithCredentials(username, chance.hash());

        return expect(promise).to.be.rejected;
      });
    });
  });

  describe('login with refresh token', function () {
    let refreshToken: string;

    beforeEach(async function () {
      const response = await dependencies.loginService.createWithCredentials(username, password);
      refreshToken = response.refreshToken;
    });

    context('when refreshToken is valid', function () {
      it('returns an access and refresh token', async function () {
        const response = await dependencies.loginService.createWithRefreshToken(refreshToken);

        expect(response.accessToken).to.exist;
        expect(response.refreshToken).to.exist;
      });
    });

    context('when refreshToken is invalid', function () {
      it('throws an error', async function () {
        const promise = dependencies.loginService.createWithRefreshToken(chance.hash());

        return expect(promise).to.be.rejected;
      });
    });
  });

  describe('logout', function () {
    let refreshToken: string;

    beforeEach(async function () {
      const response = await dependencies.loginService.createWithCredentials(username, password);
      dependencies.tokenService.setAccessToken(response.accessToken);
      refreshToken = response.refreshToken;
    });

    afterEach(async function () {
      dependencies.tokenService.setAccessToken(administratorAccessToken);
    });

    it('invalidates the associated refresh token', async function () {
      await dependencies.loginService.delete();

      const promise = dependencies.loginService.createWithRefreshToken(refreshToken);
      return expect(promise).to.be.rejected;
    });
  });
});
