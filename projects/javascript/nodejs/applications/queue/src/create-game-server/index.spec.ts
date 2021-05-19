import {
  gameServerService,
  QueueMemberModel,
  queueMemberService,
  queueMemberStore,
  QueueModel,
} from '@tenlastic/http';

import { expect } from 'chai';
import * as sinon from 'sinon';

import { createGameServer } from './';

describe('create-game-server', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('removes the User from all Queues', async function() {
    const queue = new QueueModel({
      _id: '1',
      gameServerTemplate: {
        buildId: '1',
        cpu: 1,
        memory: 1,
        metadata: {},
        preemptible: true,
      },
      name: 'name',
      namespaceId: '1',
      teams: 2,
      usersPerTeam: 1,
    });
    queueMemberStore.upsert('1', new QueueMemberModel({ _id: '1', userIds: ['1'] }));
    queueMemberStore.upsert('2', new QueueMemberModel({ _id: '2', userIds: ['2'] }));
    queueMemberStore.upsert('3', new QueueMemberModel({ _id: '3', userIds: ['3'] }));

    const createGameServerSpy = sandbox.stub(gameServerService, 'create').resolves({ _id: '1' });
    const findGameServersSpy = sandbox.stub(gameServerService, 'find').resolves([]);
    const queueMemberSpy = sandbox.stub(queueMemberService, 'delete').resolves();

    const result = await createGameServer(queue);

    expect(result).to.eql({ _id: '1' });
    expect(createGameServerSpy.calledOnce).to.eql(true);
    expect(findGameServersSpy.calledOnce).to.eql(true);
    expect(queueMemberSpy.calledTwice).to.eql(true);
  });
});
