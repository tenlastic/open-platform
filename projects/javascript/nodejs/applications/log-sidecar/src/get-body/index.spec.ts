import { expect } from 'chai';

import { getBody } from './';

describe('getBody()', function() {
  it('extracts the body from a log entry', function() {
    const value = '2020-07-12T20:29:58.5896575Z First Line';

    const results = getBody(value);

    expect(results).to.eql('First Line');
  });
});
