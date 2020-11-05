import {
  GameServer,
  GameServerMock,
  QueueMemberMock,
  QueueMock,
  UserMock,
  QueueMember,
} from '@tenlastic/mongoose-models';
import * as Chance from 'chance';
import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { createGameServer } from './';

const chance = new Chance();

describe('create-game-server', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when User is not in a match', function() {
    it('creates a GameServer', async function() {
      const gameServerTemplate = new GameServer({ buildId: mongoose.Types.ObjectId() });
      const queue = await QueueMock.create({ gameServerTemplate });
      const queueMember = await QueueMemberMock.create();

      const spy = sinon.spy(GameServer, 'find');

      await createGameServer(queue, [queueMember]);

      expect(spy.called).to.eql(false);
    });
  });

  context('when User is in a match', function() {
    it('removes the User from all Queues', async function() {
      const user = await UserMock.create();
      const otherUser = await UserMock.create();

      const gameServerTemplate = new GameServer({ buildId: mongoose.Types.ObjectId() });
      const queue = await QueueMock.create({ gameServerTemplate });

      await GameServerMock.create({
        allowedUserIds: [user],
        namespaceId: queue.namespaceId,
        queueId: queue._id,
      });
      await GameServerMock.create({
        allowedUserIds: [otherUser],
        namespaceId: queue.namespaceId,
      });

      const queueMember = await QueueMemberMock.create({ userId: user._id });
      const otherQueueMember = await QueueMemberMock.create({ userId: otherUser._id });

      await createGameServer(queue, [queueMember, otherQueueMember]);

      const queueMemberCount = await QueueMember.countDocuments({ _id: queueMember._id });
      const otherQueueMemberCount = await QueueMember.countDocuments({ _id: otherQueueMember._id });

      expect(queueMemberCount).to.eql(0);
      expect(otherQueueMemberCount).to.eql(1);
    });
  });
});
