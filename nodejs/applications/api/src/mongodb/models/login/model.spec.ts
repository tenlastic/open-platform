import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { RefreshToken, RefreshTokenMock } from '../refresh-token';
import { UserDocument, UserMock } from '../user';
import { Login } from './model';

use(chaiAsPromised);

describe('mongodb/models/login/model', function () {
  describe('createWithAccessAndRefreshTokens()', function () {
    let user: UserDocument;

    beforeEach(async function () {
      user = await UserMock.create();
    });

    it('returns an accessToken and refreshToken', async function () {
      const result = await Login.createAccessAndRefreshTokens(user);

      expect(result.accessToken).to.exist;
      expect(result.refreshToken).to.exist;
      expect(result.refreshTokenId).to.exist;
    });

    it('creates and returns a refreshToken', async function () {
      const { refreshToken } = await Login.createAccessAndRefreshTokens(user);

      const { jti } = jwt.decode(refreshToken) as any;
      const count = await RefreshToken.countDocuments({ _id: jti, userId: user._id });

      expect(count).to.eql(1);
    });

    it('updates an existing refreshToken', async function () {
      const existingRefreshToken = await RefreshTokenMock.create({ userId: user._id });
      const { refreshToken } = await Login.createAccessAndRefreshTokens(
        user,
        existingRefreshToken._id,
      );

      const { jti } = jwt.decode(refreshToken) as any;
      const count = await RefreshToken.countDocuments({ _id: jti, userId: user._id });

      expect(count).to.eql(1);
    });

    it('throws an error', async function () {
      const jti = new mongoose.Types.ObjectId();
      const promise = Login.createAccessAndRefreshTokens(user, jti);

      return expect(promise).to.be.rejectedWith(`Cannot read properties of null (reading \'_id\')`);
    });
  });
});
