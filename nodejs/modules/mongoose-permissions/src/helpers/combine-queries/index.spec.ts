import { expect } from 'chai';

import { combineQueriesWithAnd, combineQueriesWithOr } from '.';

describe('combine-queries', function () {
  describe('combineQueriesWithAnd()', function () {
    it('combines multiple queries', function () {
      const first = { $and: [{ first: true }], second: true };
      const second = { first: true, second: false };
      const third = { first: false, second: false };

      const result = combineQueriesWithAnd(true, first, second, third, [], null, undefined);

      expect(result).to.eql({ $and: [first, second, third] });
    });
  });

  describe('combineQueriesWithOr()', function () {
    it('combines multiple queries', function () {
      const first = { $and: [{ first: true }], second: true };
      const second = { first: true, second: false };
      const third = { first: false, second: false };

      const result = combineQueriesWithOr(true, first, second, third, [], null, undefined);

      expect(result).to.eql({ $or: [first, second, third] });
    });
  });
});
