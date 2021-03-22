import { expect } from 'chai';
import * as requestPromiseNative from 'request-promise-native';
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
    const queue = {
      _id: '1',
      gameServerTemplate: {
        buildId: '1',
        cpu: 1,
        isPreemptible: true,
        memory: 1,
        metadata: {},
      },
      name: 'name',
      namespaceId: '1',
      teams: 2,
      usersPerTeam: 1,
    };
    const queueMembers = [
      { _id: '1', userIds: ['1'] },
      { _id: '2', userIds: ['2'] },
      { _id: '3', userIds: ['3'] },
    ];

    const gameServerSpy = sandbox.stub(requestPromiseNative, 'post').resolves({
      record: { _id: '1' },
    });
    const queueMemberSpy = sandbox.stub(requestPromiseNative, 'delete').resolves();

    const result = await createGameServer(queue, queueMembers);

    expect(result).to.eql({
      gameServer: { _id: '1' },
      queueMembers: [{ _id: '3', userIds: ['3'] }],
    });
    expect(gameServerSpy.calledOnce).to.eql(true);
    expect(queueMemberSpy.calledTwice).to.eql(true);
  });
});
