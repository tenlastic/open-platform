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
        spec: { replicas },
        status: { readyReplicas: 0, replicas },
      },
    ];
    const jobs = [
      {
        metadata: { labels: { 'tenlastic.com/role': 'B' } },
        status: { completionTime: new Date() },
      },
    ];
    const pods = [];
    const statefulSets = [
      {
        metadata: { labels: { 'tenlastic.com/role': 'C' } },
        spec: { replicas },
        status: { readyReplicas: replicas },
      },
    ];

    const result = getComponents(deployments as any, jobs as any, pods as any, statefulSets as any);

    expect(result[0]).to.eql({ current: 0, name: 'A', phase: 'Pending', total: replicas });
    expect(result[1]).to.eql({ current: 0, name: 'B', phase: 'Succeeded', total: 0 });
    expect(result[2]).to.eql({ current: replicas, name: 'C', phase: 'Running', total: replicas });
  });
});
