import { AuthorizationRole, QueueGameServerTemplate } from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  Authorization,
  Build,
  Group,
  Namespace,
  NamespaceDocument,
  Queue,
  QueueMember,
  User,
  UserDocument,
  WebSocket,
} from '../../../mongodb';
import { handler } from './';

describe('web-server/queue-members/count', function () {
  let namespace: NamespaceDocument;
  let users: UserDocument[];

  beforeEach(async function () {
    users = await Promise.all([
      User.mock().save(),
      User.mock().save(),
      User.mock().save(),
      User.mock().save(),
    ]);

    namespace = await Namespace.mock().save();
    await Authorization.mock({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.QueuesRead],
      userId: users[0]._id,
    }).save();
  });

  it('returns the number of matching records', async function () {
    const build = await Build.mock({ namespaceId: namespace._id }).save();
    const group = await Group.mock({ userIds: [users[1]._id, users[2]._id] }).save();
    const queue = await Queue.mock({
      gameServerTemplate: QueueGameServerTemplate.mock({ buildId: build._id }),
      namespaceId: namespace._id,
      usersPerTeam: 2,
    }).save();
    const webSockets = await Promise.all([
      WebSocket.mock({ userId: users[0]._id }).save(),
      WebSocket.mock({ userId: users[1]._id }).save(),
    ]);
    await Promise.all([
      QueueMember.mock({
        namespaceId: namespace._id,
        queueId: queue._id,
        userId: users[0]._id,
        webSocketId: webSockets[0]._id,
      }).save(),
      QueueMember.mock({
        groupId: group._id,
        namespaceId: namespace._id,
        queueId: queue._id,
        userId: users[1]._id,
        webSocketId: webSockets[1]._id,
      }).save(),
    ]);
    const ctx = new ContextMock({ state: { user: users[0].toObject() } });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(3);
  });
});
