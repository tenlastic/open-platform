import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { UserModel } from './model';

const chance = new Chance();
use(chaiAsPromised);

describe('models/user', function () {
  describe('hashPassword()', function () {
    it('creates a hash from the given plaintext value', async function () {
      const password = chance.hash();
      const hash = await UserModel.hashPassword(password);

      expect(hash).to.match(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('isValidPassword()', function () {
    it(`validates the given plaintext password against the User's password`, async function () {
      const password = chance.hash();
      const user = await UserModel.mock({ password }).save();

      const isValidPassword = await user.isValidPassword(password);

      expect(isValidPassword).to.eql(true);
    });
  });
});
