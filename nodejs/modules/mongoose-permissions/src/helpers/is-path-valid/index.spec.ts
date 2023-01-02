import { expect } from 'chai';

import { isPathValid } from './';

describe('is-path-valid', function () {
  context('when matching the absolute path', function () {
    it('returns true', function () {
      const key = 'first';
      const paths = ['user'];
      const permissions = ['user.first'];

      const result = isPathValid(key, paths, permissions);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const key = 'last';
      const paths = ['user'];
      const permissions = ['user.first'];

      const result = isPathValid(key, paths, permissions);

      expect(result).to.eql(false);
    });
  });

  context('when matching the wildcard path', function () {
    it('returns true', function () {
      const key = 'first';
      const paths = ['user'];
      const permissions = ['user.*'];

      const result = isPathValid(key, paths, permissions);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const key = 'first';
      const paths = ['record'];
      const permissions = ['user.*'];

      const result = isPathValid(key, paths, permissions);

      expect(result).to.eql(false);
    });
  });

  context('when matching a subpath', function () {
    it('returns true', function () {
      const key = 'user';
      const paths = [];
      const permissions = ['user.first'];

      const result = isPathValid(key, paths, permissions);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const key = 'owner';
      const paths = [];
      const permissions = ['user.first'];

      const result = isPathValid(key, paths, permissions);

      expect(result).to.eql(false);
    });
  });
});
