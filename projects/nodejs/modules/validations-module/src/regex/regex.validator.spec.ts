import { expect } from 'chai';

import { regexValidator } from './regex.validator';

describe('validators/regex', function() {
  describe('validator', function() {
    it('returns true', function() {
      const { validator } = regexValidator(/^[0-9]+.[0-9]+.[0-9]+$/);
      const result = validator('1.2.3');

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const { validator } = regexValidator(/^[0-9]+.[0-9]+.[0-9]+$/);
      const result = validator('1..3');

      expect(result).to.eql(false);
    });
  });
});
