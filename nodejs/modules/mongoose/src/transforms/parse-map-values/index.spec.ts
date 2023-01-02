import { expect } from 'chai';

import { parseMapValues } from '.';

describe('transforms/parse-map-values', function () {
  it('parses values from strings', function () {
    const input = { zero: '0' };

    const result = parseMapValues(input);

    expect(result.get('zero')).to.eql(0);
  });
});
