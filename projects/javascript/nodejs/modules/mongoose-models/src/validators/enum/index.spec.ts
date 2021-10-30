import { expect } from 'chai';

import { enumValidator } from './';

describe('validators/enum', function () {
  describe('msg', function () {
    it('shows the message', function () {
      const { msg } = enumValidator([1, 3, 5]);

      expect(msg).to.eql('Value must be one of the following: 1, 3, 5.');
    });
  });

  describe('validator', function () {
    it('returns true', function () {
      const { validator } = enumValidator([1, 3, 5]);
      const result = validator(1);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const { validator } = enumValidator([1, 3, 5]);
      const result = validator(2);

      expect(result).to.eql(false);
    });
  });
});
