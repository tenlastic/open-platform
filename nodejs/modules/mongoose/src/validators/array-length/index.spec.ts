import { expect } from 'chai';

import { arrayLengthValidator } from './';

describe('validators/array-length', function () {
  describe('msg', function () {
    it('shows the min message', function () {
      const { msg } = arrayLengthValidator(0, 5);

      expect(msg).to.eql('Value cannot contain less than 5 items.');
    });

    it('shows the max messages', function () {
      const { msg } = arrayLengthValidator(10);

      expect(msg).to.eql('Value cannot contain more than 10 items.');
    });

    it('shows the min and max messages', function () {
      const { msg } = arrayLengthValidator(10, 5);

      expect(msg).to.eql('Value cannot contain less than 5 and more than 10 items.');
    });
  });

  describe('validator', function () {
    it('returns true', function () {
      const { validator } = arrayLengthValidator(5);
      const result = validator([0, 1, 2, 3, 4]);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const { validator } = arrayLengthValidator(3);
      const result = validator([0, 1, 2, 3, 4]);

      expect(result).to.eql(false);
    });
  });
});
