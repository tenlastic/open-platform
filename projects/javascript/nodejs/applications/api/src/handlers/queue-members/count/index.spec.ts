import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  QueueMock,
  GameInvitationMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceRolesMock,
  QueueMemberMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/queue-members/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });
    const queue = await QueueMock.create({ namespaceId: namespace._id });

    await GameInvitationMock.create({ namespaceId: namespace._id, toUserId: user._id });
    await QueueMemberMock.create({ queueId: queue._id, userId: user._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
