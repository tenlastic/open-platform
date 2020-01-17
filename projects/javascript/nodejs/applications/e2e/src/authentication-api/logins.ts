import { expect } from 'chai';
import * as Chance from 'chance';

import { UserModel } from '../models';
import { request } from '../request';

const HOST_AUTHENTICATION_API = process.env.E2E_HOST_AUTHENTICATION_API;
const chance = new Chance();

describe('logins', function() {
  let email: string;
  let password: string;

  beforeEach(async function() {
    email = chance.email();
    password = chance.hash();

    await UserModel.create({ email, password });
  });

  afterEach(async function() {
    await UserModel.deleteAll();
  });

  describe('login', function() {
    context('when password is valid', function() {
      it('returns an access and refresh token', async function() {
        const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins', {
          email,
          password,
        });

        expect(response.statusCode).to.eql(200);
        expect(response.body.accessToken).to.exist;
        expect(response.body.refreshToken).to.exist;
      });
    });

    context('when password is invalid', function() {
      it('does not return an access and refresh token', async function() {
        const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins', {
          email,
          password: chance.hash(),
        });

        expect(response.statusCode).to.eql(400);
        expect(response.body.accessToken).to.not.exist;
        expect(response.body.refreshToken).to.not.exist;
      });
    });
  });

  describe('login with refresh token', function() {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async function() {
      const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins', {
        email,
        password,
      });
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    context('when refreshToken is valid', function() {
      it('returns an access and refresh token', async function() {
        const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins/refresh-token', {
          token: refreshToken,
        });

        expect(response.statusCode).to.eql(200);
        expect(response.body.accessToken).to.exist;
        expect(response.body.refreshToken).to.exist;
      });
    });

    context('when refreshToken is invalid', function() {
      it('returns an access and refresh token', async function() {
        const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins/refresh-token', {
          token: chance.hash(),
        });

        expect(response.statusCode).to.eql(400);
        expect(response.body.accessToken).to.not.exist;
        expect(response.body.refreshToken).to.not.exist;
      });
    });
  });

  describe('logout', function() {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async function() {
      const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins', {
        email,
        password,
      });
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('returns a 200 status code', async function() {
      const response = await request(HOST_AUTHENTICATION_API, 'delete', '/logins', null, {
        jwt: accessToken,
      });

      expect(response.statusCode).to.eql(200);
    });

    it('invalidates the associated refresh token', async function() {
      await request(HOST_AUTHENTICATION_API, 'delete', '/logins', null, { jwt: accessToken });

      const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins/refresh-token', {
        token: refreshToken,
      });

      expect(response.statusCode).to.eql(400);
    });
  });
});
