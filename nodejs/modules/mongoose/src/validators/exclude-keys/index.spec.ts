import { expect } from 'chai';

import { excludeKeysValidator } from './';

describe('validators/exclude-keys', function () {
  context('when the value is a Map', function () {
    it('returns true', function () {
      const value = new Map([['key', 'value']]);

      const { validator } = excludeKeysValidator(['default']);
      const result = validator(value);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const value = new Map([['key', 'value']]);

      const { validator } = excludeKeysValidator(['key']);
      const result = validator(value);

      expect(result).to.eql(false);
    });
  });

  context('when the value is an Object', function () {
    it('returns true', function () {
      const value = { key: 'value' };

      const { validator } = excludeKeysValidator(['default']);
      const result = validator(value);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const value = { key: 'value' };

      const { validator } = excludeKeysValidator(['key']);
      const result = validator(value);

      expect(result).to.eql(false);
    });
  });

  context('when the value is something else', function () {
    it('returns true', function () {
      const value = 'string';

      const { validator } = excludeKeysValidator(['string']);
      const result = validator(value);

      expect(result).to.eql(true);
    });
  });
});
