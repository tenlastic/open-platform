import {
  GameInvitationMock,
  GameServer,
  GameServerMock,
  NamespaceMock,
  QueueMember,
  QueueMemberMock,
  QueueMock,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect } from 'chai';
import * as mongoose from 'mongoose';
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
    const namespace = await NamespaceMock.create();
    const user = await UserMock.create();
    const otherUser = await UserMock.create();

    await GameInvitationMock.create({ namespaceId: namespace._id, userId: user._id });
    await GameInvitationMock.create({ namespaceId: namespace._id, userId: otherUser._id });

    const gameServerTemplate = new GameServer({
      buildId: mongoose.Types.ObjectId(),
      cpu: 0.25,
      memory: 0.25,
      namespaceId: namespace._id,
    });
    const queue = await QueueMock.create({
      gameServerTemplate,
      namespaceId: namespace._id,
      usersPerTeam: 1,
    });

    await GameServerMock.create({
      allowedUserIds: [user],
      namespaceId: queue.namespaceId,
      queueId: queue._id,
    });
    await GameServerMock.create({
      allowedUserIds: [otherUser],
      namespaceId: queue.namespaceId,
    });

    const queueMember = await QueueMemberMock.create({ queueId: queue._id, userId: user._id });
    const otherQueueMember = await QueueMemberMock.create({
      queueId: queue._id,
      userId: otherUser._id,
    });

    await removeConflictedUsers(queue, [queueMember.userId, otherQueueMember.userId]);

    const queueMemberCount = await QueueMember.countDocuments({ _id: queueMember._id });
    const otherQueueMemberCount = await QueueMember.countDocuments({ _id: otherQueueMember._id });

    expect(queueMemberCount).to.eql(0);
    expect(otherQueueMemberCount).to.eql(1);
  });
});
