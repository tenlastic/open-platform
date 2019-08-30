import * as e2e from '@tenlastic/e2e';
import { expect } from 'chai';
import * as Chance from 'chance';

import { UserDocument } from '../src/models';
import { UserModel } from './models';

const chance = new Chance();

describe('logins', function() {
  let email: string;
  let password: string;
  let user: UserDocument;

  beforeEach(async function() {
    email = chance.email();
    password = chance.hash();

    const response = await UserModel.create({ email, password });
    user = response.body.record;
  });

  afterEach(async function() {
    await UserModel.deleteAll();
  });

  describe('login', function() {
    context('when password is valid', function() {
      it('returns an access and refresh token', async function() {
        const response = await e2e.request('post', '/logins', { email, password });

        expect(response.statusCode).to.eql(200);
        expect(response.body.accessToken).to.exist;
        expect(response.body.refreshToken).to.exist;
      });
    });

    context('when password is invalid', function() {
      it('does not return an access and refresh token', async function() {
        const response = await e2e.request('post', '/logins', { email, password: chance.hash() });

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
      const response = await e2e.request('post', '/logins', { email, password });
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    context('when refreshToken is valid', function() {
      it('returns an access and refresh token', async function() {
        const response = await e2e.request('post', '/logins/refresh-token', {
          token: refreshToken,
        });

        expect(response.statusCode).to.eql(200);
        expect(response.body.accessToken).to.exist;
        expect(response.body.refreshToken).to.exist;
      });
    });

    context('when refreshToken is invalid', function() {
      it('returns an access and refresh token', async function() {
        const response = await e2e.request('post', '/logins/refresh-token', {
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
      const response = await e2e.request('post', '/logins', { email, password });
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('returns a 200 status code', async function() {
      const response = await e2e.request('delete', '/logins', null, { jwt: accessToken });

      expect(response.statusCode).to.eql(200);
    });

    it('invalidates the associated refresh token', async function() {
      await e2e.request('delete', '/logins', null, { jwt: accessToken });

      const response = await e2e.request('post', '/logins/refresh-token', {
        token: refreshToken,
      });

      expect(response.statusCode).to.eql(400);
    });
  });
});
