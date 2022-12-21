import { expect } from 'chai';

import { entryLengthValidator } from './';

describe('validators/entry-length', function () {
  describe('msg', function () {
    it('shows the min message', function () {
      const { msg } = entryLengthValidator(0, 5);

      expect(msg).to.eql('Value cannot contain less than 5 entries.');
    });

    it('shows the max messages', function () {
      const { msg } = entryLengthValidator(10);

      expect(msg).to.eql('Value cannot contain more than 10 entries.');
    });

    it('shows the min and max messages', function () {
      const { msg } = entryLengthValidator(10, 5);

      expect(msg).to.eql('Value cannot contain less than 5 and more than 10 entries.');
    });
  });

  describe('validator', function () {
    it('returns true', function () {
      const { validator } = entryLengthValidator(5);
      const result = validator({ 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 });

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const { validator } = entryLengthValidator(3);
      const result = validator({ 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 });

      expect(result).to.eql(false);
    });
  });
});
