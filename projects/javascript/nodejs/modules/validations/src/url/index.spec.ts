import { expect } from 'chai';

import { urlValidator } from './';

describe('validators/url', function() {
  describe('validator', function() {
    it('returns true', function() {
      const result = urlValidator.validator('http://valid.url/path');

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const result = urlValidator.validator('http://invalidurl/path');

      expect(result).to.eql(false);
    });
  });
});
