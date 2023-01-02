import { expect } from 'chai';

import { arrayNullUndefinedValidator } from './';

describe('validators/array-null-undefined', function () {
  describe('validator', function () {
    it('returns true', function () {
      const { validator } = arrayNullUndefinedValidator;
      const result = validator([0, 1, 2, 3, 4]);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const { validator } = arrayNullUndefinedValidator;
      const result = validator([0, 1, null, 3, 4]);

      expect(result).to.eql(false);
    });
  });
});
