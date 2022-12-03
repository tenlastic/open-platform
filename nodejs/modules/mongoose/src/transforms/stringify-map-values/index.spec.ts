import { expect } from 'chai';

import { stringifyMapValues } from '.';

describe('transforms/stringify-map-values', function () {
  it('converts values to strings', function () {
    const input = { zero: 0 };

    const result = stringifyMapValues(input);

    expect(result.get('zero')).to.eql('0');
  });
});
