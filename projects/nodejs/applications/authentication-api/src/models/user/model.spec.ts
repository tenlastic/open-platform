import { expect } from 'chai';
import * as Chance from 'chance';
import * as jwt from 'jsonwebtoken';
import * as sinon from 'sinon';

import * as emails from '../../emails';
import { RefreshToken } from '../refresh-token/model';
import { UserMock } from './model.mock';
import { User, UserDocument } from './model';

const chance = new Chance();

describe('models/user.model', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`pre('save')`, function() {
    context('when document.isNew() is true', function() {
      it('does not call sendPasswordResetConfirmation()', async function() {
        const spy = sandbox.stub(emails, 'sendPasswordResetConfirmation');

        await UserMock.create();

        expect(spy.calledOnce).to.eql(false);
      });
    });

    context('when document.isNew() is false', function() {
      it('calls sendPasswordResetConfirmation()', async function() {
        const user = await UserMock.create({ password: chance.hash() });

        const spy = sandbox.stub(emails, 'sendPasswordResetConfirmation');

        user.password = chance.hash();
        await user.save();

        expect(spy.calledOnce).to.eql(true);
      });
    });
  });

  describe('hashPassword()', function() {
    it('creates a hash from the given plaintext value', async function() {
      const password = chance.hash();
      const hash = await User.hashPassword(password);

      expect(hash).to.match(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('isValidPassword()', function() {
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
