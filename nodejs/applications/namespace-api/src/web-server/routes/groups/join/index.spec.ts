import {
  AuthorizationModel,
  AuthorizationRole,
  GroupDocument,
  GroupInvitationModel,
  GroupModel,
  NamespaceDocument,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, UpdateOneContext } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { handler } from '.';

use(chaiAsPromised);

describe('web-server/groups/join', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when a Group Invitation exists', function () {
    let ctx: UpdateOneContext<GroupDocument>;
    let namespace: NamespaceDocument;
    let otherUser: UserDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      otherUser = await UserModel.mock().save();

      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GroupsPlay],
        userId: otherUser._id,
      }).save();

      const group = await GroupModel.mock({
        namespaceId: namespace._id,
        userId: user._id,
        userIds: [user._id],
      }).save();
      await GroupInvitationModel.mock({
        fromUserId: user._id,
        groupId: group._id,
        namespaceId: namespace._id,
        toUserId: otherUser._id,
      }).save();

      ctx = ContextMock({
        params: { _id: group._id, namespaceId: namespace._id },
        state: { user: { _id: otherUser._id.toHexString() } },
      });
    });

    it('adds the current User to the Group', async function () {
      await handler(ctx);

      expect(ctx.response.body.record).to.exist;
      expect(ctx.response.body.record.userIds[1].equals(otherUser._id)).to.eql(true);
    });
  });

  context('when a Group Invitation does not exist', function () {
    let ctx: UpdateOneContext<GroupDocument>;
    let namespace: NamespaceDocument;
    let otherUser: UserDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      otherUser = await UserModel.mock().save();

      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GroupsPlay],
        userId: otherUser._id,
      }).save();

      const group = await GroupModel.mock({ userId: user._id, userIds: [user._id] }).save();

      ctx = ContextMock({
        params: { _id: group._id, namespaceId: namespace._id },
        state: { user: { _id: otherUser._id.toHexString() } },
      });
    });

    it('returns an error', async function () {
      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith('Record not found.');
    });
  });
});
