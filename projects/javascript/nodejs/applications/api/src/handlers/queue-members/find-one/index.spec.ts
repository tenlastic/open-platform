import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

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

use(chaiAsPromised);

describe('handlers/queue-members/find-one', function() {
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

  it('returns the record', async function() {
    const ctx = new ContextMock({
      params: {
        _id: record._id,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
