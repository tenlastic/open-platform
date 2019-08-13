import { expect } from 'chai';
import * as sinon from 'sinon';

import * as emails from '../../emails';
import { UserMock } from '../user/model.mock';
import { PasswordResetMock } from './model.mock';

describe('models/password-reset/model', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`pre('save')`, function() {
    context('when document.isNew() is true', function() {
      it('calls sendPasswordResetRequest()', async function() {
        const spy = sandbox.stub(emails, 'sendPasswordResetRequest');

        const user = await UserMock.create();
        await PasswordResetMock.create({ userId: user._id });

        expect(spy.calledOnce).to.eql(true);
      });
    });

    context('when document.isNew() is false', function() {
      it('does not call sendPasswordResetRequest()', async function() {
        const user = await UserMock.create();
        const passwordReset = await PasswordResetMock.create({ userId: user._id });

        const spy = sandbox.stub(emails, 'sendPasswordResetRequest');

        passwordReset.userId = null;
        await passwordReset.save();

        expect(spy.calledOnce).to.eql(false);
      });
    });
  });
});
