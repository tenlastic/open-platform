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
        spec: { replicas, selector: null, template: null },
        status: { readyReplicas: 0, replicas },
      },
    ];
    const jobs = [
      {
        metadata: { labels: { 'tenlastic.com/role': 'B' } },
        status: { completionTime: new Date() },
      },
    ];
    const pods = [
      {
        metadata: {
          labels: { 'tenlastic.com/role': 'A' },
          ownerReferences: [
            { apiVersion: 'apiVersion', kind: 'ReplicaSet', name: 'name', uid: 'uid' },
          ],
        },
      },
      {
        metadata: { labels: { 'tenlastic.com/role': 'C' } },
        status: { conditions: [{ status: 'True', type: 'Ready' }], phase: 'Running' },
      },
    ];
    const statefulSets = [
      {
        metadata: { labels: { 'tenlastic.com/role': 'D' } },
        spec: { replicas, selector: null, template: null },
        status: { readyReplicas: replicas, replicas: null },
      },
    ];

    const result = getComponents(deployments, jobs, pods, statefulSets);

    expect(result[0]).to.eql({ current: 0, name: 'A', phase: 'Pending', total: replicas });
    expect(result[1]).to.eql({ current: 0, name: 'B', phase: 'Succeeded', total: 0 });
    expect(result[2]).to.eql({ current: 1, name: 'C', phase: 'Running', total: 1 });
    expect(result[3]).to.eql({ current: replicas, name: 'D', phase: 'Running', total: replicas });
  });
});
