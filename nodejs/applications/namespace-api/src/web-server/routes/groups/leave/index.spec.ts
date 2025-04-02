import {
  AuthorizationModel,
  AuthorizationRole,
  GroupModel,
  NamespaceModel,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from '.';

use(chaiAsPromised);

describe('web-server/groups/leave', function () {
  it('removes the Leader', async function () {
    const namespace = await NamespaceModel.mock().save();
    const otherUser = await UserModel.mock().save();
    const user = await UserModel.mock().save();
    await AuthorizationModel.mock({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.GroupsPlay],
      userId: user._id,
    }).save();

    const record = await GroupModel.mock({
      namespaceId: namespace._id,
      userId: user._id,
      userIds: [user._id, otherUser._id],
    }).save();

    const ctx = new ContextMock({
      params: {
        _id: record.userIds[0],
        groupId: record._id,
        namespaceId: record.namespaceId,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record.userId.equals(record.userIds[1])).to.eql(true);
    expect(ctx.response.body.record.userIds.length).to.eql(1);
    expect(ctx.response.body.record.userIds[0].equals(record.userIds[1])).to.eql(true);
  });

  it('removes the User', async function () {
    const namespace = await NamespaceModel.mock().save();
    const otherUser = await UserModel.mock().save();
    const user = await UserModel.mock().save();
    await AuthorizationModel.mock({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.GroupsPlay],
      userId: otherUser._id,
    }).save();

    const record = await GroupModel.mock({
      namespaceId: namespace._id,
      userId: user._id,
      userIds: [user._id, otherUser._id],
    }).save();

    const ctx = new ContextMock({
      params: {
        _id: record.userIds[1],
        groupId: record._id,
        namespaceId: record.namespaceId,
      },
      state: { user: otherUser },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record.userId.equals(record.userIds[0])).to.eql(true);
    expect(ctx.response.body.record.userIds.length).to.eql(1);
    expect(ctx.response.body.record.userIds[0].equals(record.userIds[0])).to.eql(true);
  });
});
