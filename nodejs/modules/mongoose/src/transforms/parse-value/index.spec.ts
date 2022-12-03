import { expect } from 'chai';

import { parseValue } from '.';

describe('transforms/parse-value', function () {
  it('parses value from string', function () {
    const input = JSON.stringify({ zero: 0 });

    const result = parseValue(input);

    expect(result).to.eql({ zero: 0 });
  });
});
