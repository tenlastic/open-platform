import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  QueueMock,
  GameMock,
  GameInvitationMock,
  NamespaceMock,
  QueueMemberDocument,
  QueueMemberMock,
  UserDocument,
  UserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/queue-members/find-one', function() {
  let record: QueueMemberDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
    const game = await GameMock.create({ namespaceId: namespace._id });
    const queue = await QueueMock.create({ gameId: game._id });

    await GameInvitationMock.create({ gameId: game._id, toUserId: user._id });
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
