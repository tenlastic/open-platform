import { expect } from 'chai';

import { split } from './';

describe('split()', function() {
  it('properly splits Kubernetes logs into multiple lines', function() {
    const first = '2020-07-12T20:29:58.5896575Z First Line';
    const second = '2020-07-12T20:29:58.5944985Z Second Line';
    const value = `${first}\n${second}\n\n`;

    const results = split(value);

    expect(results).to.eql([first, second]);
  });
});
