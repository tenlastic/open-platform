import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { RefreshToken, RefreshTokenMock } from '../refresh-token';
import { UserDocument, UserMock } from '../user';
import { Login } from './model';

use(chaiAsPromised);

describe('models/login/model', function () {
  describe('createWithAccessAndRefreshTokens()', function () {
    let user: UserDocument;

    beforeEach(async function () {
      user = await UserMock.create();
    });

    it('returns an accessToken and refreshToken', async function () {
      const { accessToken, refreshToken } = await Login.createWithAccessAndRefreshTokens({}, user);

      expect(accessToken).to.exist;
      expect(refreshToken).to.exist;
    });

    it('creates and returns a refreshToken', async function () {
      const { refreshToken } = await Login.createWithAccessAndRefreshTokens({}, user);

      const { jti } = jwt.decode(refreshToken) as any;
      const count = await RefreshToken.countDocuments({ _id: jti, userId: user._id });

      expect(count).to.eql(1);
    });

    it('updates an existing refreshToken', async function () {
      const existingRefreshToken = await RefreshTokenMock.create({ userId: user._id });
      const { refreshToken } = await Login.createWithAccessAndRefreshTokens(
        { refreshTokenId: existingRefreshToken._id },
        user,
      );

      const { jti } = jwt.decode(refreshToken) as any;
      const count = await RefreshToken.countDocuments({ _id: jti, userId: user._id });

      expect(count).to.eql(1);
    });

    it('throws an error', async function () {
      const jti = new mongoose.Types.ObjectId();
      const promise = Login.createWithAccessAndRefreshTokens({ refreshTokenId: jti }, user);

      return expect(promise).to.be.rejectedWith(`Cannot read property '_id' of null`);
    });
  });
});
