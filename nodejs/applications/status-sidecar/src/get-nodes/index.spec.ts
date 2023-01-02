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
        status: {
          containerStatuses: [
            { name: 'first', ready: true, state: { running: true } },
            { name: 'second', ready: false, state: { running: true } },
          ],
        },
      },
    ];

    const result = getNodes(pods as any);

    expect(result[0].component).to.eql(role);
    expect(result[0].container).to.eql('first');
    expect(result[0].phase).to.eql('Running');
    expect(result[0].pod).to.eql(pods[0].metadata.name);

    expect(result[1].component).to.eql(role);
    expect(result[1].container).to.eql('second');
    expect(result[1].phase).to.eql('Pending');
    expect(result[1].pod).to.eql(pods[0].metadata.name);
  });
});
