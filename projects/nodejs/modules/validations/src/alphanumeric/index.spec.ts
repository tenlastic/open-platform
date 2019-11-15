import { expect } from 'chai';

import { alphanumericValidator } from './';

describe('validators/alphanumeric', function() {
  describe('validator', function() {
    it('returns true', function() {
      const result = alphanumericValidator.validator('Aa1');

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const result = alphanumericValidator.validator('Aa1!@#');

      expect(result).to.eql(false);
    });
  });
});
