import { expect } from 'chai';

import { arrayMaxMinValidator } from './';

describe('validators/array-max-min', function () {
  describe('msg', function () {
    it('shows the min message', function () {
      const { msg } = arrayMaxMinValidator(0, 5);

      expect(msg).to.eql('Values cannot be less than 5.');
    });

    it('shows the max messages', function () {
      const { msg } = arrayMaxMinValidator(10);

      expect(msg).to.eql('Values cannot be more than 10.');
    });

    it('shows the min and max messages', function () {
      const { msg } = arrayMaxMinValidator(10, 5);

      expect(msg).to.eql('Values cannot be less than 5 and more than 10.');
    });
  });

  describe('validator', function () {
    it('returns true', function () {
      const { validator } = arrayMaxMinValidator(5);
      const result = validator([0, 1, 2, 3, 4]);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const { validator } = arrayMaxMinValidator(3);
      const result = validator([0, 1, 2, 3, 4]);

      expect(result).to.eql(false);
    });
  });
});
