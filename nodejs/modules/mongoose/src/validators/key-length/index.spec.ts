import { expect } from 'chai';

import { keyLengthValidator } from './';

describe('validators/key-length', function () {
  describe('msg', function () {
    it('shows the min message', function () {
      const { msg } = keyLengthValidator(0, 5);

      expect(msg).to.eql('Keys cannot be less than 5 characters.');
    });

    it('shows the max messages', function () {
      const { msg } = keyLengthValidator(10);

      expect(msg).to.eql('Keys cannot be more than 10 characters.');
    });

    it('shows the min and max messages', function () {
      const { msg } = keyLengthValidator(10, 5);

      expect(msg).to.eql('Keys cannot be less than 5 and more than 10 characters.');
    });
  });

  describe('validator', function () {
    context('when the value is a Map', function () {
      it('returns true', function () {
        const value = new Map([['key', 'value']]);

        const { validator } = keyLengthValidator(8);
        const result = validator(value);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const value = new Map([['key', 'value']]);

        const { validator } = keyLengthValidator(2);
        const result = validator(value);

        expect(result).to.eql(false);
      });
    });

    context('when the value is an Object', function () {
      it('returns true', function () {
        const value = { key: 'value' };

        const { validator } = keyLengthValidator(4);
        const result = validator(value);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const value = { key: 'value' };

        const { validator } = keyLengthValidator(2);
        const result = validator(value);

        expect(result).to.eql(false);
      });
    });

    context('when the value is something else', function () {
      it('returns true', function () {
        const value = 'key';

        const { validator } = keyLengthValidator(4);
        const result = validator(value);

        expect(result).to.eql(true);
      });
    });
  });
});
