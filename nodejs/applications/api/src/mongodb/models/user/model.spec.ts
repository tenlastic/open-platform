import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import mailgun from '../../../mailgun';
import { UserMock } from './model.mock';
import { User } from './model';

const chance = new Chance();
use(chaiAsPromised);

describe('mongodb/models/user/model', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe(`pre('save')`, function () {
    context('when document.isNew() is true', function () {
      it('does not call sendPasswordResetConfirmation()', async function () {
        const spy = sandbox.stub(mailgun, 'sendPasswordResetConfirmation');

        await UserMock.create();

        expect(spy.calledOnce).to.eql(false);
      });
    });

    context('when document.isNew() is false', function () {
      it('calls sendPasswordResetConfirmation()', async function () {
        const user = await UserMock.create({ password: chance.hash() });

        const spy = sandbox.stub(mailgun, 'sendPasswordResetConfirmation');

        user.password = chance.hash();
        await user.save();

        expect(spy.calledOnce).to.eql(true);
      });
    });
  });

  describe('hashPassword()', function () {
    it('creates a hash from the given plaintext value', async function () {
      const password = chance.hash();
      const hash = await User.hashPassword(password);

      expect(hash).to.match(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('isValidPassword()', function () {
    it(`validates the given plaintext password against the User's password`, async function () {
      const password = chance.hash();
      const user = await UserMock.create({ password });

      const isValidPassword = await user.isValidPassword(password);

      expect(isValidPassword).to.eql(true);
    });
  });
});
