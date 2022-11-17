import { expect } from 'chai';

import { combineQueries } from '.';

describe('combine-queries', function () {
  it('combines multiple queries', function () {
    const first = { $and: [{ first: true }], second: true };
    const second = { first: true, second: false };
    const third = { first: false, second: false };

    const result = combineQueries(first, second, third, [], null, undefined);

    expect(result).to.eql({ $and: [first, second, third] });
  });
});
