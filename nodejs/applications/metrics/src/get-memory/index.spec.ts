import { expect } from 'chai';

import { getMemory } from '.';

describe('get-memory', function () {
  it('returns total memory', function () {
    const resourceQuotas = [
      { status: { used: { memory: '1G' } } },
      { status: { used: { memory: '1M' } } },
      { status: { used: { memory: '1K' } } },
      { status: { used: { memory: '1' } } },
    ];

    const result = getMemory(resourceQuotas as any);

    expect(result).to.eql(1001001001);
  });
});
