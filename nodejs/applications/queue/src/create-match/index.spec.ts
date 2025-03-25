import { QueueMemberModel, QueueModel } from '@tenlastic/http';

import dependencies from '../dependencies';

import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import { createMatch } from './';

use(chaiAsPromised);

describe('create-match', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('throws an error when not enough Queue Members exist', async function () {
    const queue = new QueueModel({
      _id: '1',
      gameServerTemplateId: '1',
      name: 'name',
      namespaceId: '1',
      thresholds: [{ seconds: 0, usersPerTeam: [1, 1] }],
    });

    const queueMembers = [
      new QueueMemberModel({ _id: '1', createdAt: new Date(0), userIds: ['1'] }),
    ];
    dependencies.queueMemberStore.upsertMany(queueMembers);

    const promise = createMatch(queue);

    return expect(promise).to.be.rejectedWith('Not enough Queue Members. Users: 1.');
  });

  it('throws an error when a Queue Member is already in a Match', async function () {
    const queue = new QueueModel({
      _id: '1',
      gameServerTemplateId: '1',
      name: 'name',
      namespaceId: '1',
      thresholds: [{ seconds: 0, usersPerTeam: [1, 1] }],
    });

    const queueMembers = [
      new QueueMemberModel({ _id: '1', createdAt: new Date(0), userIds: ['1'] }),
      new QueueMemberModel({ _id: '2', createdAt: new Date(), userIds: ['2'] }),
    ];
    dependencies.queueMemberStore.upsertMany(queueMembers);

    const error = new Error('Error creating Match.');
    const createMatchSpy = sandbox.stub(dependencies.matchService, 'create').rejects(error);
    const findMatchesSpy = sandbox.stub(dependencies.matchService, 'find').resolves([]);

    const promise = createMatch(queue);

    await expect(promise).to.be.rejectedWith(error);

    expect(createMatchSpy.calledOnce).to.eql(true);
    expect(findMatchesSpy.calledOnce).to.eql(true);
  });

  it('finds a Match', async function () {
    const queue = new QueueModel({
      _id: '1',
      gameServerTemplateId: '1',
      name: 'name',
      namespaceId: '1',
      thresholds: [{ seconds: 0, usersPerTeam: [1, 1] }],
    });

    const queueMembers = [
      new QueueMemberModel({ _id: '1', createdAt: new Date(0), userIds: ['1'] }),
      new QueueMemberModel({ _id: '2', createdAt: new Date(), userIds: ['2'] }),
      new QueueMemberModel({ _id: '3', createdAt: new Date(), userIds: ['3'] }),
    ];
    dependencies.queueMemberStore.upsertMany(queueMembers);

    const createMatchSpy = sandbox.stub(dependencies.matchService, 'create').resolves({ _id: '1' });
    const upsertManyQueueMemberSpy = sandbox
      .stub(dependencies.queueMemberStore, 'upsertMany')
      .resolves();

    const result = await createMatch(queue);

    expect(result).to.eql({ _id: '1' });

    expect(createMatchSpy.calledOnce).to.eql(true);
    expect(createMatchSpy.getCall(0).args[0]).to.eql(queue.namespaceId);
    expect(createMatchSpy.getCall(0).args[1]).to.eql({
      gameServerTemplateId: queue.gameServerTemplateId,
      queueId: queue._id,
      teams: [
        { index: 0, userIds: ['1'] },
        { index: 1, userIds: ['2'] },
      ],
    });

    expect(upsertManyQueueMemberSpy.calledTwice).to.eql(true);
  });

  it('finds a Match when the first attempt fails', async function () {
    const queue = new QueueModel({
      _id: '1',
      gameServerTemplateId: '1',
      name: 'name',
      namespaceId: '1',
      thresholds: [{ seconds: 0, usersPerTeam: [2, 2] }],
    });

    const queueMembers = [
      new QueueMemberModel({ _id: '1', createdAt: new Date(0), userIds: ['1'] }),
      new QueueMemberModel({ _id: '2', createdAt: new Date(0), userIds: ['2'] }),
      new QueueMemberModel({ _id: '3', createdAt: new Date(0), userIds: ['3'] }),
      new QueueMemberModel({ _id: '4', createdAt: new Date(0), userIds: ['4', '5'] }),
    ];
    dependencies.queueMemberStore.upsertMany(queueMembers);

    const createMatchSpy = sandbox.stub(dependencies.matchService, 'create').resolves({ _id: '1' });
    const upsertManyQueueMemberSpy = sandbox
      .stub(dependencies.queueMemberStore, 'upsertMany')
      .resolves();

    const result = await createMatch(queue);

    expect(result).to.eql({ _id: '1' });

    expect(createMatchSpy.calledOnce).to.eql(true);
    expect(createMatchSpy.getCall(0).args[0]).to.eql(queue.namespaceId);
    expect(createMatchSpy.getCall(0).args[1]).to.eql({
      gameServerTemplateId: queue.gameServerTemplateId,
      queueId: queue._id,
      teams: [
        { index: 0, userIds: ['4', '5'] },
        { index: 1, userIds: ['1'] },
        { index: 1, userIds: ['2'] },
      ],
    });

    expect(upsertManyQueueMemberSpy.calledThrice).to.eql(true);
  });
});
