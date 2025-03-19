import {
  AuthorizationModel,
  AuthorizationRole,
  GroupMemberModel,
  GroupModel,
  NamespaceModel,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from '.';

use(chaiAsPromised);

describe('web-server/groups/remove-member', function () {
  it('returns the record', async function () {
    const namespace = await NamespaceModel.mock().save();
    const otherUser = await UserModel.mock().save();
    const user = await UserModel.mock().save();
    await AuthorizationModel.mock({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.GroupsPlay],
      userId: user._id,
    }).save();

    const record = await GroupModel.mock({
      members: [
        GroupMemberModel.mock({ userId: user._id }),
        GroupMemberModel.mock({ userId: otherUser._id }),
      ],
      namespaceId: namespace._id,
    }).save();

    const ctx = new ContextMock({
      params: {
        _id: record.members[0]._id,
        groupId: record._id,
        namespaceId: record.namespaceId,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record.members.length).to.eql(1);
    expect(ctx.response.body.record.members[0]._id).to.eql(record.members[0]._id);
  });
});
