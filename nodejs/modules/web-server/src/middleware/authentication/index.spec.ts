import { use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { ContextMock } from '../../context';
import { authenticationMiddleware } from './';

const chance = new Chance();
const noop = async () => {};

use(chaiAsPromised);

describe('middleware/authentication', function () {
  context('when the user is set', function () {
    it('calls through', async function () {
      const user = { _id: chance.hash() };
      const ctx = new ContextMock({ state: { user } });

      await authenticationMiddleware(ctx as any, noop);
    });
  });
});
