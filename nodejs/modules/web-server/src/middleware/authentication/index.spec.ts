import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { UnauthorizedError } from '../../errors';
import { ContextMock } from '../../mocks';
import { authenticationMiddleware } from './';

const chance = new Chance();
const noop = async () => {};

use(chaiAsPromised);

describe('middleware/authentication', function () {
  context('when the user is set', function () {
    it('calls through', async function () {
      const user = { _id: chance.hash() };
      const ctx = ContextMock({ state: { user } });

      await authenticationMiddleware(ctx, noop);
    });
  });

  context('when the user is not set', function () {
    it('throws an error', async function () {
      const ctx = ContextMock();

      const promise = authenticationMiddleware(ctx, noop);

      return expect(promise).to.be.rejectedWith(UnauthorizedError);
    });
  });
});
