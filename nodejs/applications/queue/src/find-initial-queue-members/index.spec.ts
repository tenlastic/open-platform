import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import dependencies from '../dependencies';
import { findInitialQueueMembers } from '.';

const chance = new Chance();

describe('find-initial-queue-members', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('recursively fetches all Queue Members', async function () {
    const index = chance.integer();
    const length = chance.integer({ max: 99, min: 1 });
    const namespaceId = chance.hash();
    const queueId = chance.hash();
    const replicas = chance.integer();

    const stub = sandbox.stub(dependencies.queueMemberService, 'find');

    stub.onFirstCall().resolves(Array.from({ length: 100 }));
    stub.onSecondCall().resolves(Array.from({ length }));

    const result = await findInitialQueueMembers(index, namespaceId, queueId, replicas);

    expect(result.length).to.eql(100 + length);
    expect(stub.getCall(0).args).to.eql([
      namespaceId,
      {
        limit: 100,
        skip: 0,
        where: { queueId, unix: { $mod: [replicas, index] } },
      },
    ]);
    expect(stub.getCall(1).args).to.eql([
      namespaceId,
      {
        limit: 100,
        skip: 100,
        where: { queueId, unix: { $mod: [replicas, index] } },
      },
    ]);
  });
});
