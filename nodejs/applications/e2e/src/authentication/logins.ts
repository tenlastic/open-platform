import {
  getAccessToken,
  loginService,
  setAccessToken,
  UserModel,
  userService,
} from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

const chance = new Chance();
use(chaiAsPromised);

describe('logins', function () {
  let password: string;
  let user: UserModel;
  let username: string;

  beforeEach(async function () {
    password = chance.hash();
    username = chance.hash({ length: 20 });

    user = await userService.create({ password, username });
  });

  afterEach(async function () {
    await userService.delete(user._id);
  });

  describe('login with credentials', function () {
    context('when password is valid', function () {
      it('returns an access and refresh token', async function () {
        const { accessToken, refreshToken } = await loginService.createWithCredentials(
          username,
          password,
        );

        expect(accessToken).to.exist;
        expect(refreshToken).to.exist;
      });
    });

    context('when password is invalid', function () {
      it('throws an error', async function () {
        const promise = loginService.createWithCredentials(username, chance.hash());

        return expect(promise).to.be.rejected;
      });
    });
  });

  describe('login with refresh token', function () {
    let refreshToken: string;

    beforeEach(async function () {
      const response = await loginService.createWithCredentials(username, password);
      refreshToken = response.refreshToken;
    });

    context('when refreshToken is valid', function () {
      it('returns an access and refresh token', async function () {
        const response = await loginService.createWithRefreshToken(refreshToken);

        expect(response.accessToken).to.exist;
        expect(response.refreshToken).to.exist;
      });
    });

    context('when refreshToken is invalid', function () {
      it('throws an error', async function () {
        const promise = loginService.createWithRefreshToken(chance.hash());

        return expect(promise).to.be.rejected;
      });
    });
  });

  describe('logout', function () {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async function () {
      const response = await loginService.createWithCredentials(username, password);
      refreshToken = response.refreshToken;

      accessToken = await getAccessToken();
      setAccessToken(response.accessToken);
    });

    afterEach(async function () {
      setAccessToken(accessToken);
    });

    it('invalidates the associated refresh token', async function () {
      await loginService.delete();

      const promise = loginService.createWithRefreshToken(refreshToken);
      return expect(promise).to.be.rejected;
    });
  });
});
