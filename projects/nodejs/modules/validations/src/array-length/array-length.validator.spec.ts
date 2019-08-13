import { expect } from 'chai';

import { arrayLengthValidator } from './array-length.validator';

describe('validators/array-length', function() {
  describe('validator', function() {
    it('returns true', function() {
      const { validator } = arrayLengthValidator(1);
      const result = validator([1]);

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const { validator } = arrayLengthValidator(1);
      const result = validator([1, 2, 3]);

      expect(result).to.eql(false);
    });
  });
});
