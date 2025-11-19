import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { RefreshTokenModel } from '../refresh-token';
import { UserDocument, UserModel } from '../user';
import { LoginModel } from './model';

interface Jwt {
  jti?: string;
}

use(chaiAsPromised);

describe('models/login', function () {
  describe('createWithAccessAndRefreshTokens()', function () {
    let user: UserDocument;

    beforeEach(async function () {
      user = await UserModel.mock().save();
    });

    it('returns an accessToken and refreshToken', async function () {
      const result = await LoginModel.createAccessAndRefreshTokens(user);

      expect(result.accessToken).to.exist;
      expect(result.refreshToken).to.exist;
      expect(result.refreshTokenId).to.exist;
    });

    it('creates and returns a refreshToken', async function () {
      const { refreshToken } = await LoginModel.createAccessAndRefreshTokens(user);

      const { jti } = jwt.decode(refreshToken) as Jwt;
      const count = await RefreshTokenModel.countDocuments({ _id: jti, userId: user._id });

      expect(count).to.eql(1);
    });

    it('updates an existing refreshToken', async function () {
      const existingRefreshToken = await RefreshTokenModel.mock({ userId: user._id }).save();
      const { refreshToken } = await LoginModel.createAccessAndRefreshTokens(user, {
        refreshTokenId: existingRefreshToken._id,
      });

      const { jti } = jwt.decode(refreshToken) as Jwt;
      const count = await RefreshTokenModel.countDocuments({ _id: jti, userId: user._id });

      expect(count).to.eql(1);
    });

    it('throws an error', async function () {
      const jti = new mongoose.Types.ObjectId();
      const promise = LoginModel.createAccessAndRefreshTokens(user, { refreshTokenId: jti });

      return expect(promise).to.be.rejectedWith(`Cannot read properties of null (reading '_id')`);
    });
  });
});
