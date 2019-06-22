import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { ContextMock } from '../../mocks';
import { authenticationMiddleware } from './authentication.middleware';

const chance = new Chance();
const noop = () => {};

use(chaiAsPromised);

describe('middleware/authentication', function() {
  context('when the user is set', function() {
    it('calls through', async function() {
      const user = { _id: chance.hash(), isActive: true };
      const ctx = new ContextMock({ state: { user } });

      await authenticationMiddleware(ctx as any, noop);
    });
  });

  context('when the user is not active', function() {
    it('throws an error', function() {
      const user = { _id: chance.hash(), isActive: false };
      const ctx = new ContextMock({ state: { user } });

      const promise = authenticationMiddleware(ctx as any, noop);

      return expect(promise).to.be.rejectedWith('Invalid access token.');
    });
  });
});
