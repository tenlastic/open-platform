import { QueueMemberModel, QueueModel } from '@tenlastic/http';

import dependencies from '../dependencies';

import { expect } from 'chai';
import * as sinon from 'sinon';

import { createMatch } from './';

describe('create-match', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('removes the User from all Queues', async function () {
    const queue = new QueueModel({
      _id: '1',
      gameServerTemplateId: '1',
      name: 'name',
      namespaceId: '1',
      usersPerTeam: [1, 1],
    });
    dependencies.queueMemberStore.upsert('1', new QueueMemberModel({ _id: '1', userIds: ['1'] }));
    dependencies.queueMemberStore.upsert('2', new QueueMemberModel({ _id: '2', userIds: ['2'] }));
    dependencies.queueMemberStore.upsert('3', new QueueMemberModel({ _id: '3', userIds: ['3'] }));

    const createMatchSpy = sandbox.stub(dependencies.matchService, 'create').resolves({ _id: '1' });
    const deleteQueueMemberSpy = sandbox.stub(dependencies.queueMemberStore, 'remove').resolves();
    const findMatchSpy = sandbox.stub(dependencies.matchService, 'find').resolves([]);

    const result = await createMatch(queue);

    expect(result).to.eql({ _id: '1' });
    expect(createMatchSpy.calledOnce).to.eql(true);
    expect(deleteQueueMemberSpy.calledTwice).to.eql(true);
    expect(findMatchSpy.calledOnce).to.eql(true);
  });
});
