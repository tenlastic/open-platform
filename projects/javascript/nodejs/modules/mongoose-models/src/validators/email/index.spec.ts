import { expect } from 'chai';

import { emailValidator } from './';

describe('validators/email', function() {
  describe('validator', function() {
    it('returns true', function() {
      const result = emailValidator.validator('test@example.com');

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const result = emailValidator.validator('a@b.c');

      expect(result).to.eql(false);
    });
  });
});
