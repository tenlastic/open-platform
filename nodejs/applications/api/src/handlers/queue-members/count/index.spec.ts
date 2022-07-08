import {
  AuthorizationMock,
  AuthorizationRole,
  GroupMock,
  NamespaceDocument,
  NamespaceMock,
  QueueMemberMock,
  QueueMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('handlers/queue-members/count', function () {
  let namespace: NamespaceDocument;
  let users: UserDocument[];

  beforeEach(async function () {
    users = await Promise.all([
      UserMock.create(),
      UserMock.create(),
      UserMock.create(),
      UserMock.create(),
    ]);

    namespace = await NamespaceMock.create();
    await AuthorizationMock.create({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.QueuesRead],
      userId: users[0]._id,
    });
  });

  it('returns the number of matching records', async function () {
    const group = await GroupMock.create({ userIds: [users[1]._id, users[2]._id] });
    const queue = await QueueMock.create({ namespaceId: namespace._id, usersPerTeam: 2 });
    await Promise.all([
      QueueMemberMock.create({
        namespaceId: namespace._id,
        queueId: queue._id,
        userId: users[0]._id,
      }),
      QueueMemberMock.create({
        groupId: group._id,
        namespaceId: namespace._id,
        queueId: queue._id,
      }),
    ]);
    const ctx = new ContextMock({ state: { user: users[0].toObject() } });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(3);
  });
});
