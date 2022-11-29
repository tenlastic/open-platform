import { expect } from 'chai';

import { alphabeticalKeysValidator } from './';

describe('validators/alphabeticalKeysValidator', function () {
  context('when the value is a Map', function () {
    it('returns true', function () {
      const value = new Map([['key', 'value']]);

      const result = alphabeticalKeysValidator.validator(value);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const value = new Map([['key.key', 'value']]);

      const result = alphabeticalKeysValidator.validator(value);

      expect(result).to.eql(false);
    });
  });

  context('when the value is an Object', function () {
    it('returns true', function () {
      const value = { key: 'value' };

      const result = alphabeticalKeysValidator.validator(value);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const value = { 'key.key': 'value' };

      const result = alphabeticalKeysValidator.validator(value);

      expect(result).to.eql(false);
    });
  });

  context('when the value is something else', function () {
    it('returns true', function () {
      const value = 'string';

      const result = alphabeticalKeysValidator.validator(value);

      expect(result).to.eql(true);
    });
  });
});
