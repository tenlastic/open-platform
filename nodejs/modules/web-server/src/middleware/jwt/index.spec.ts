import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as jwt from 'jsonwebtoken';

import { ContextMock } from '../../mocks';
import { jwtMiddleware } from './';

const chance = new Chance();
const noop = async () => {};

use(chaiAsPromised);

describe('middleware/jwt', function () {
  context('when the token is valid', function () {
    it(`sets the user state object to the token's user`, async function () {
      const user = { _id: chance.hash() };
      const token = jwt.sign(
        { type: 'access', user },
        process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        { algorithm: 'RS256' },
      );

      const ctx = ContextMock({ request: { headers: { authorization: token } } });

      await jwtMiddleware(ctx, noop);

      expect(ctx.state.user._id).to.eql(user._id);
    });
  });

  context('when the token is invalid', function () {
    it('does not affect the user', async function () {
      const ctx = ContextMock({ request: { headers: { authorization: chance.hash() } } });

      await jwtMiddleware(ctx, noop);

      expect(ctx.state.user).to.not.exist;
    });
  });
});
