import { expect } from 'chai';

import { merge } from './';

describe('merge', function() {
  it('merges JSON files', function() {
    const report = merge('./mochawesome-report/*.json');
    const suites = report.results;

    expect(report.stats.end).to.be.a('string');
    expect(report.stats.start).to.be.a('string');
    expect(suites.length).to.eql(3);

    expect(suites[0].tests.length).to.eql(1);
    expect(suites[0].passes.length).to.eql(0);
    expect(suites[0].failures.length).to.eql(1);

    expect(suites[1].tests.length).to.eql(3);
    expect(suites[1].passes.length).to.eql(1);
    expect(suites[1].failures.length).to.eql(2);

    expect(suites[2].tests.length).to.eql(2);
    expect(suites[2].passes.length).to.eql(2);
    expect(suites[2].failures.length).to.eql(0);
  });
});
