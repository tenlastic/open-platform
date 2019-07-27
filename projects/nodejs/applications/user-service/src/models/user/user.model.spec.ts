import { expect } from 'chai';
import * as Chance from 'chance';
import * as jwt from 'jsonwebtoken';

import { RefreshToken } from '../refresh-token/refresh-token.model';
import { UserMock } from './user.model.mock';
import { User, UserDocument } from './user.model';

const chance = new Chance();

describe('models/user.model', function() {
  describe('hashPassword()', function() {
    it('creates a hash from the given plaintext value', async function() {
      const password = chance.hash();
      const hash = await User.hashPassword(password);

      expect(hash).to.match(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('isValid()', function() {
    it(`validates the given plaintext password against the User's password`, async function() {
      const password = chance.hash();
      const user = await UserMock.create({ password });

      const isValidPassword = await user.isValidPassword(password);

      expect(isValidPassword).to.eql(true);
    });
  });

  describe('logIn()', function() {
    let user: UserDocument;

    beforeEach(async function() {
      user = await UserMock.create();
    });

    it('returns an accessToken and refreshToken', async function() {
      const { accessToken, refreshToken } = await user.logIn();

      expect(accessToken).to.exist;
      expect(refreshToken).to.exist;
    });

    it('creates and returns a refreshToken', async function() {
      const { refreshToken } = await user.logIn();

      const { jti } = jwt.decode(refreshToken) as any;
      const count = await RefreshToken.countDocuments({ jti, userId: user._id });

      expect(count).to.eql(1);
    });
  });
});
