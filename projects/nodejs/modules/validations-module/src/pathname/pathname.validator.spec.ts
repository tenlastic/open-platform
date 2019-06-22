import { expect } from 'chai';

import { pathnameValidator } from './pathname.validator';

describe('validators/pathname', function() {
  describe('validator', function() {
    it('returns true', function() {
      const result = pathnameValidator.validator('Valid (Pathname)');

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const result = pathnameValidator.validator('Invalid/Pathname');

      expect(result).to.eql(false);
    });
  });
});
