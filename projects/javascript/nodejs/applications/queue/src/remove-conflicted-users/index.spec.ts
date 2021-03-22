import { expect } from 'chai';
import * as requestPromiseNative from 'request-promise-native';
import * as sinon from 'sinon';

import { removeConflictedUsers } from './';

describe('remove-conflicted-users', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('removes the User from all Queues', async function() {
    const queue = { namespaceId: '1' };
    const queueMembers = [
      { _id: '1', userIds: ['1'] },
      { _id: '2', userIds: ['2'] },
    ];

    const gameServerSpy = sandbox.stub(requestPromiseNative, 'get').resolves({
      records: [{ authorizedUserIds: [queueMembers[0].userIds[0]] }],
    });
    const queueMemberSpy = sandbox.stub(requestPromiseNative, 'delete').resolves();

    const result = await removeConflictedUsers(queue, queueMembers);

    expect(result).to.eql([{ _id: '2', userIds: ['2'] }]);
    expect(gameServerSpy.calledOnce).to.eql(true);
    expect(queueMemberSpy.calledOnce).to.eql(true);
  });
});
