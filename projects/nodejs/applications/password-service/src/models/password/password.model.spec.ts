import { expect } from 'chai';
import * as Chance from 'chance';

import { PasswordMock } from './password.model.mock';
import { Password } from './password.model';

const chance = new Chance();

describe('models/password.model', function() {
  describe('getHashFromPlaintext()', function() {
    it('creates a hash from the given plaintext value', async function() {
      const password = await PasswordMock.create();
      const initialHash = password.hash;

      password.hash = await Password.getHashFromPlaintext(chance.hash());

      expect(password.hash).to.not.eql(initialHash);
    });
  });

  describe('isValid()', function() {
    it(`validates the given plaintext password against the password's hash`, async function() {
      const plaintext = chance.hash();
      const password = await PasswordMock.create();
      password.hash = await Password.getHashFromPlaintext(plaintext);

      const isValid = await password.isValid(plaintext);

      expect(isValid).to.eql(true);
    });
  });
});
