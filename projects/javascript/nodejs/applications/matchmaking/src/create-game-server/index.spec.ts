import {
  GameInvitationMock,
  GameServer,
  NamespaceMock,
  QueueMemberMock,
  QueueMock,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { createGameServer } from './';

describe('create-game-server', function() {
  it('creates a GameServer', async function() {
    const namespace = await NamespaceMock.create();
    const user = await UserMock.create();
    await GameInvitationMock.create({ namespaceId: namespace._id, userId: user._id });
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
    const queueMember = await QueueMemberMock.create({ queueId: queue._id, userId: user._id });

    const result = await createGameServer(queue, [queueMember.userId]);

    expect(result).to.exist;
  });
});
