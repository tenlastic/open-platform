import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as jwt from 'jsonwebtoken';

import { ContextMock } from '../../context';
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
        {
          algorithm: 'RS256',
        },
      );

      const ctx = new ContextMock({ request: { headers: { authorization: token } } });

      await jwtMiddleware(ctx as any, noop);

      expect(ctx.state.user._id).to.eql(user._id);
    });
  });

  context('when the token is invalid', function () {
    it('does not affect the user', async function () {
      const ctx = new ContextMock({ request: { headers: { authorization: chance.hash() } } });

      await jwtMiddleware(ctx as any, noop);

      expect(ctx.state.user).to.eql(undefined);
    });
  });
});
