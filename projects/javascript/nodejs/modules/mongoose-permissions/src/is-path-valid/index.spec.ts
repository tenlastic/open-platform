import { expect } from 'chai';

import { isPathValid } from './';

describe('is-path-valid', function() {
  context('when matching the absolute path', function() {
    it('returns true', function() {
      const key = 'first';
      const path = ['user'];
      const permissions = ['user.first'];

      const result = isPathValid(permissions, path, key);

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const key = 'last';
      const path = ['user'];
      const permissions = ['user.first'];

      const result = isPathValid(permissions, path, key);

      expect(result).to.eql(false);
    });
  });

  context('when matching the wildcard path', function() {
    it('returns true', function() {
      const key = 'first';
      const path = ['user'];
      const permissions = ['user.*'];

      const result = isPathValid(permissions, path, key);

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const key = 'first';
      const path = ['record'];
      const permissions = ['user.*'];

      const result = isPathValid(permissions, path, key);

      expect(result).to.eql(false);
    });
  });

  context('when matching a subpath', function() {
    it('returns true', function() {
      const key = 'user';
      const path = [];
      const permissions = ['user.first'];

      const result = isPathValid(permissions, path, key);

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const key = 'owner';
      const path = [];
      const permissions = ['user.first'];

      const result = isPathValid(permissions, path, key);

      expect(result).to.eql(false);
    });
  });
});
