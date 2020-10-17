import { expect } from 'chai';

import { getUnix } from './';

describe('getUnix()', function() {
  it('extracts the Unix timestamp from a log entry', function() {
    const value = '2020-07-12T20:29:58.5896575Z First Line';

    const results = getUnix(value);

    expect(results).to.eql(1594585798589);
  });
});
