import { ContextMock } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';
import { expect } from 'chai';

import {
  AuthorizationMock,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceMock,
  QueueMemberMock,
  UserDocument,
  UserMock,
} from '../../../mongodb';
import { handler } from './';

describe('web-server/queue-members/count', function () {
  let namespace: NamespaceDocument;
  let users: UserDocument[];

  beforeEach(async function () {
    users = await Promise.all([UserMock.create(), UserMock.create(), UserMock.create()]);

    namespace = await NamespaceMock.create();
    await AuthorizationMock.create({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.QueuesRead],
      userId: users[0]._id,
    });
  });

  it('returns the number of matching records', async function () {
    const queueId = new mongoose.Types.ObjectId();
    await Promise.all([
      QueueMemberMock.create({ namespaceId: namespace._id, queueId, userIds: [users[0]._id] }),
      QueueMemberMock.create({
        namespaceId: namespace._id,
        queueId,
        userIds: [users[1]._id, users[2]._id],
      }),
    ]);
    const ctx = new ContextMock({ state: { user: users[0].toObject() } });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(3);
  });
});
