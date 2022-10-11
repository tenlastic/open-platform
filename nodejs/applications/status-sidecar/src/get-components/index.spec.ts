import { expect } from 'chai';
import { Chance } from 'chance';

import { getComponents } from '.';

const chance = new Chance();

describe('get-components', function () {
  it('returns components', function () {
    const replicas = chance.integer({ max: 10, min: 1 });

    const deployments = [
      {
        metadata: { labels: { 'tenlastic.com/role': 'A' } },
        status: { readyReplicas: 0, replicas },
      },
    ];
    const statefulSets = [
      {
        metadata: { labels: { 'tenlastic.com/role': 'B' } },
        status: { readyReplicas: replicas, replicas },
      },
    ];

    const result = getComponents(deployments, statefulSets);

    expect(result[0]).to.eql({ current: 0, name: 'A', phase: 'Pending', total: replicas });
    expect(result[1]).to.eql({ current: replicas, name: 'B', phase: 'Running', total: replicas });
  });
});
