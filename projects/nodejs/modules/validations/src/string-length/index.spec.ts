import { expect } from 'chai';

import { stringLengthValidator } from './';

describe('validators/string-length', function() {
  describe('msg', function() {
    it('shows the min message', function() {
      const { msg } = stringLengthValidator(5, 0);

      expect(msg).to.eql('Value cannot contain less than 5 characters.');
    });

    it('shows the max messages', function() {
      const { msg } = stringLengthValidator(0, 10);

      expect(msg).to.eql('Value cannot contain more than 10 characters.');
    });

    it('shows the min and max messages', function() {
      const { msg } = stringLengthValidator(5, 10);

      expect(msg).to.eql('Value cannot contain less than 5 and more than 10 characters.');
    });
  });

  describe('validator', function() {
    it('returns true', function() {
      const { validator } = stringLengthValidator(0, 5);
      const result = validator('12345');

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const { validator } = stringLengthValidator(0, 5);
      const result = validator('123456');

      expect(result).to.eql(false);
    });
  });
});
