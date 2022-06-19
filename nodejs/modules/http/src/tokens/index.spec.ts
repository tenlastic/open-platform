import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as jwt from 'jsonwebtoken';
import * as sinon from 'sinon';

import { loginService } from '../services';
import { ExpiredRefreshTokenError, getAccessToken, setAccessToken, setRefreshToken } from './';

use(chaiAsPromised);

describe('tokens', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('getAccessToken()', function() {
    context('when the access token is not expired', function() {
      it('returns the access token', async function() {
        const accessToken = jwt.sign({}, 'secret', { expiresIn: 60 });
        setAccessToken(accessToken);

        const result = await getAccessToken();

        expect(result).to.eql(accessToken);
      });
    });

    context('when the access token is expired and there is no refresh token', function() {
      it('returns null', async function() {
        const accessToken = jwt.sign({}, 'secret', { expiresIn: 0 });
        setAccessToken(accessToken);

        const result = await getAccessToken();

        expect(result).to.eql(null);
      });
    });

    context('when the access token is expired and the refresh token is expired', function() {
      it('throws an error', async function() {
        const accessToken = jwt.sign({}, 'secret', { expiresIn: 0 });
        setAccessToken(accessToken);

        const refreshToken = jwt.sign({}, 'secret', { expiresIn: 0 });
        setRefreshToken(refreshToken);

        const promise = getAccessToken();

        return expect(promise).to.be.rejectedWith(ExpiredRefreshTokenError);
      });
    });

    context('when the access token is expired and the refresh token is not expired', function() {
      it('returns a new access token', async function() {
        const accessToken = jwt.sign({}, 'secret', { expiresIn: 0 });
        setAccessToken(accessToken);

        const refreshToken = jwt.sign({}, 'secret', { expiresIn: 60 });
        setRefreshToken(refreshToken);

        const newAccessToken = jwt.sign({}, 'secret', { expiresIn: 0 });
        sandbox
          .stub(loginService, 'createWithRefreshToken')
          .resolves({ accessToken: newAccessToken });

        const result = await getAccessToken();

        expect(result).to.eql(newAccessToken);
      });
    });
  });
});
