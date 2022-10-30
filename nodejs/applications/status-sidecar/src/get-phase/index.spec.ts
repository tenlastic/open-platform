import { expect } from 'chai';

import { getPhase } from '.';
import { NamespaceLimitError } from '../get-message';

describe('get-phase', function () {
  it('returns an error', function () {
    const result = getPhase([], NamespaceLimitError, []);

    expect(result).to.eql('Error');
  });

  it('returns Running', function () {
    const components = [{ phase: 'Running' }];

    const result = getPhase(components as any, null, []);

    expect(result).to.eql('Running');
  });
});
