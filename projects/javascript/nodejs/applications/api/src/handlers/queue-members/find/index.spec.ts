import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  QueueMock,
  GameInvitationMock,
  NamespaceMock,
  QueueMemberDocument,
  QueueMemberMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/queue-members/find', function() {
  let record: QueueMemberDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['queues'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    const queue = await QueueMock.create({ namespaceId: namespace._id });

    await GameInvitationMock.create({ namespaceId: namespace._id, toUserId: user._id });
    record = await QueueMemberMock.create({ queueId: queue._id, userId: user._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
