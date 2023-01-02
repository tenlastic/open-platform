import { expect } from 'chai';

import { stringifyValue } from '.';

describe('transforms/stringify-value', function () {
  it('converts value to string', function () {
    const input = { zero: 0 };

    const result = stringifyValue(input);

    expect(result).to.eql(JSON.stringify({ zero: 0 }));
  });
});
