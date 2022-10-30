import { expect } from 'chai';

import { getCpu } from '.';

describe('get-cpu', function () {
  it('returns total CPU', function () {
    const resourceQuotas = [
      { status: { used: { cpu: '1' } } },
      { status: { used: { cpu: '1000m' } } },
      { status: { used: { cpu: '100m' } } },
      { status: { used: { cpu: '10m' } } },
    ];

    const result = getCpu(resourceQuotas as any);

    expect(result).to.eql(2.11);
  });
});
