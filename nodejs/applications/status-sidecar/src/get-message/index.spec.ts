import { expect } from 'chai';

import { getMessage, NamespaceLimitError } from '.';

describe('get-message', function () {
  it('returns message', function () {
    const deployments = [
      { status: { conditions: [{ message: 'exceeded quota', status: null, type: null }] } },
    ];
    const jobs = [{ status: { conditions: [] } }];
    const statefulSets = [
      { metadata: { name: 'name' }, status: { conditions: [], replicas: null } },
    ];

    const result = getMessage(deployments, {}, jobs, statefulSets);

    expect(result).to.eql(NamespaceLimitError);
  });

  it('returns nothing', function () {
    const deployments = [{ status: { conditions: [] } }];
    const jobs = [{ status: { conditions: [] } }];
    const statefulSets = [
      { metadata: { name: 'name' }, status: { conditions: [], replicas: null } },
    ];

    const result = getMessage(deployments, {}, jobs, statefulSets);

    expect(result).to.not.exist;
  });
});
