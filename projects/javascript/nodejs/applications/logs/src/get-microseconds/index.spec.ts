import { expect } from 'chai';

import { getMicroseconds } from './';

describe('getMicroseconds()', function() {
  it('extracts the Unix timestamp from a log entry', function() {
    const value = '2020-07-12T20:29:58.5896575Z First Line';

    const results = getMicroseconds(value);

    expect(results).to.eql(6575);
  });
});
