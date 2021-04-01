import { gameServerService, queueMemberService } from '@tenlastic/http';
import { expect } from 'chai';
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

    const gameServerSpy = sandbox
      .stub(gameServerService, 'find')
      .resolves([{ authorizedUserIds: [queueMembers[0].userIds[0]] }]);
    const queueMemberSpy = sandbox.stub(queueMemberService, 'delete').resolves(queueMembers[0]);

    const result = await removeConflictedUsers(queue, queueMembers);

    expect(result).to.eql([{ _id: '1', userIds: ['1'] }]);
    expect(gameServerSpy.calledOnce).to.eql(true);
    expect(queueMemberSpy.calledOnce).to.eql(true);
  });
});
