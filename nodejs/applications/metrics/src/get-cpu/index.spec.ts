import { expect } from 'chai';

import { getCpu } from '.';

describe('get-cpu', function () {
  it('returns total CPU', function () {
    const pods = [
      { spec: { containers: [{ resources: { limits: { cpu: '1' } } }] } },
      {
        spec: {
          containers: [
            { resources: { limits: { cpu: '1000m' } } },
            { resources: { limits: { cpu: '100m' } } },
          ],
        },
      },
      { spec: { containers: [{ resources: { limits: { cpu: '10m' } } }] } },
    ];

    const result = getCpu(pods as any);

    expect(result).to.eql(2.11);
  });
});
