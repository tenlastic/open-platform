import {
  AuthorizationModel,
  AuthorizationRole,
  GroupInvitationModel,
  GroupMemberModel,
  GroupModel,
  NamespaceDocument,
  NamespaceModel,
  UserDocument,
  UserModel,
  WebSocketModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-socket-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from '.';

use(chaiAsPromised);

describe('web-socket-server/routes/groups/add-member', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
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

      const webSocket = await WebSocketModel.mock({
        namespaceId: namespace._id,
        userId: otherUser._id,
      }).save();
      const member = GroupMemberModel.mock({ userId: user._id, webSocketId: webSocket._id });
      const group = await GroupModel.mock({ members: [member] }).save();
      await GroupInvitationModel.mock({
        fromUserId: user._id,
        groupId: group._id,
        namespaceId: namespace._id,
        toUserId: otherUser._id,
      }).save();

      ctx = new ContextMock({
        params: { _id: group._id },
        state: { user: otherUser, webSocket },
      } as any);
    });

    it('adds a Group Member', async function () {
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
      expect(ctx.response.body.record.members[1]).to.exist;
      expect(ctx.response.body.record.members[1].userId.toString()).to.eql(
        otherUser._id.toString(),
      );
    });
  });
});
