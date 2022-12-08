import {
  AuthorizationModel,
  AuthorizationRole,
  BuildModel,
  GroupModel,
  NamespaceDocument,
  NamespaceModel,
  QueueModel,
  QueueGameServerTemplateModel,
  QueueMemberModel,
  UserDocument,
  UserModel,
  WebSocketModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('web-server/queue-members/count', function () {
  let namespace: NamespaceDocument;
  let users: UserDocument[];

  beforeEach(async function () {
    users = await Promise.all([
      UserModel.mock().save(),
      UserModel.mock().save(),
      UserModel.mock().save(),
      UserModel.mock().save(),
    ]);

    namespace = await NamespaceModel.mock().save();
    await AuthorizationModel.mock({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.QueuesRead],
      userId: users[0]._id,
    }).save();
  });

  it('returns the number of matching records', async function () {
    const build = await BuildModel.mock({ namespaceId: namespace._id }).save();
    const group = await GroupModel.mock({ userIds: [users[1]._id, users[2]._id] }).save();
    const queue = await QueueModel.mock({
      gameServerTemplate: QueueGameServerTemplateModel.mock({ buildId: build._id }),
      namespaceId: namespace._id,
      usersPerTeam: [1, 1],
    }).save();
    const webSockets = await Promise.all([
      WebSocketModel.mock({ userId: users[0]._id }).save(),
      WebSocketModel.mock({ userId: users[1]._id }).save(),
    ]);
    await Promise.all([
      QueueMemberModel.mock({
        namespaceId: namespace._id,
        queueId: queue._id,
        userId: users[0]._id,
        webSocketId: webSockets[0]._id,
      }).save(),
      QueueMemberModel.mock({
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
