import { expect } from 'chai';

import { getMemory } from '.';

describe('get-memory', function () {
  it('returns total memory', function () {
    const pods = [
      { spec: { containers: [{ resources: { limits: { memory: '1Gi' } } }] } },
      {
        spec: {
          containers: [
            { resources: { limits: { memory: '1Mi' } } },
            { resources: { limits: { memory: '1Ki' } } },
          ],
        },
      },
      { spec: { containers: [{ resources: { limits: { memory: '1' } } }] } },
    ];

    const result = getMemory(pods as any);

    expect(result).to.eql(1074791425);
  });
});
