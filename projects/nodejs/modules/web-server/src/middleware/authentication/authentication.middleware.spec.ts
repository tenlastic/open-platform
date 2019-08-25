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
      const user = { _id: chance.hash() };
      const ctx = new ContextMock({ state: { user } });

      await authenticationMiddleware(ctx as any, noop);
    });
  });
});
