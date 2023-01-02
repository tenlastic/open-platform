import { expect } from 'chai';

import { getPhase } from '.';

describe('get-phase', function () {
  it('returns an error', function () {
    const result = getPhase([], [{ phase: 'Error' }] as any);

    expect(result).to.eql('Error');
  });

  it('returns Running', function () {
    const components = [{ phase: 'Running' }];

    const result = getPhase(components as any, []);

    expect(result).to.eql('Running');
  });
});
