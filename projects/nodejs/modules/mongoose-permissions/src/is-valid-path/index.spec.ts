import { expect } from 'chai';

import { isValidPath } from './';

describe('is-valid-path', function() {
  context('when matching the absolute path', function() {
    it('returns true', function() {
      const key = 'first';
      const path = ['user'];
      const permissions = ['user.first'];

      const result = isValidPath(permissions, path, key);

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const key = 'last';
      const path = ['user'];
      const permissions = ['user.first'];

      const result = isValidPath(permissions, path, key);

      expect(result).to.eql(false);
    });
  });

  context('when matching the wildcard path', function() {
    it('returns true', function() {
      const key = 'first';
      const path = ['user'];
      const permissions = ['user.*'];

      const result = isValidPath(permissions, path, key);

      expect(result).to.eql(true);
    });

    it('returns true', function() {
      const key = 'first';
      const path = ['record'];
      const permissions = ['user.*'];

      const result = isValidPath(permissions, path, key);

      expect(result).to.eql(false);
    });
  });
});
