import { expect } from 'chai';
import * as Chance from 'chance';

import { UserMock } from './user.model.mock';
import { User } from './user.model';

const chance = new Chance();

describe('models/user.model', function() {
  describe('hashPassword()', function() {
    it('creates a hash from the given plaintext value', async function() {
      const password = chance.hash();
      const hash = await User.hashPassword(password);

      expect(hash).to.match(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('isValid()', function() {
    it(`validates the given plaintext password against the User's password`, async function() {
      const password = chance.hash();
      const user = await UserMock.create({ password });

      const isValidPassword = await user.isValidPassword(password);

      expect(isValidPassword).to.eql(true);
    });
  });
});
