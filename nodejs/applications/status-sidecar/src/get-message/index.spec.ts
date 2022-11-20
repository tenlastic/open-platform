import { expect } from 'chai';

import { getMessage, NamespaceLimitError } from '.';

describe('get-message', function () {
  it('returns message', function () {
    const deployments = [{ status: { conditions: [{ message: 'exceeded quota' }] } }];
    const statefulSets = [{ metadata: { name: 'name' }, status: { conditions: [] } }];

    const result = getMessage(deployments as any, {}, statefulSets as any);

    expect(result).to.eql(NamespaceLimitError);
  });

  it('returns nothing', function () {
    const deployments = [{ status: { conditions: [] } }];
    const statefulSets = [{ metadata: { name: 'name' }, status: { conditions: [] } }];

    const result = getMessage(deployments, {}, statefulSets as any);

    expect(result).to.not.exist;
  });
});
