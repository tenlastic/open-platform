import { MatchModel, QueueMemberModel, QueueModel } from '@tenlastic/http';
import { expect } from 'chai';
import * as sinon from 'sinon';

import dependencies from '../dependencies';

import { deleteConflictedQueueMembers } from './';

describe('delete-conflicted-queue-members', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('deletes the Queue Members from the Queue', async function () {
    const match = new MatchModel({ teams: [{ userIds: ['1'] }] });
    const queue = new QueueModel({ namespaceId: '1' });
    const queueMembers = [
      new QueueMemberModel({ _id: '1', userIds: ['1'] }),
      new QueueMemberModel({ _id: '2', userIds: ['2'] }),
    ];

    const matchSpy = sandbox.stub(dependencies.matchService, 'find').resolves([match]);
    const queueMemberSpy = sandbox
      .stub(dependencies.queueMemberService, 'delete')
      .resolves(queueMembers[0]);

    const results = await deleteConflictedQueueMembers(queue, queueMembers);

    expect(matchSpy.calledOnce).to.eql(true);
    expect(queueMemberSpy.calledOnce).to.eql(true);
    expect(results[0]._id).to.eql('1');
    expect(results[0].userIds).to.eql(['1']);
  });
});
