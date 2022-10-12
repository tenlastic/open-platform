import { expect } from 'chai';
import { Chance } from 'chance';

import { getNodes } from '.';

const chance = new Chance();

describe('get-nodes', function () {
  it('returns nodes', function () {
    const role = chance.hash();

    const pods = [
      {
        metadata: { labels: { 'tenlastic.com/role': role }, name: chance.hash() },
        status: { conditions: [{ status: 'True', type: 'ContainersReady' }], phase: 'Running' },
      },
    ];

    const result = getNodes(pods as any);

    expect(result[0]).to.eql({ _id: pods[0].metadata.name, component: role, phase: 'Running' });
  });
});
