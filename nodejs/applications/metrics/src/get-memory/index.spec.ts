import { expect } from 'chai';

import { getMemory } from '.';

describe('get-memory', function () {
  it('returns total memory', function () {
    const resourceQuotas = [
      { status: { used: { memory: '1Gi' } } },
      { status: { used: { memory: '1Mi' } } },
      { status: { used: { memory: '1Ki' } } },
      { status: { used: { memory: '1' } } },
    ];

    const result = getMemory(resourceQuotas as any);

    expect(result).to.eql(1074791425);
  });
});
