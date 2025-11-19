import {
  AuthorizationModel,
  AuthorizationRole,
  GroupInvitationDocument,
  GroupModel,
  NamespaceDocument,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock, CreateContext } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/group-invitations/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: CreateContext<GroupInvitationDocument>;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GroupsPlay, AuthorizationRole.GroupsPlay],
        userId: user._id,
      }).save();
      const group = await GroupModel.mock({
        namespaceId: namespace._id,
        userId: user._id,
        userIds: [user._id],
      }).save();

      ctx = ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            groupId: group._id,
            toUserId: user._id,
          },
        },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    it('creates a Group Invitation', async function () {
      await handler(ctx);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function () {
    let ctx: CreateContext<GroupInvitationDocument>;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GroupsPlay, AuthorizationRole.GroupsPlay],
        userId: user._id,
      }).save();
      const group = await GroupModel.mock({ namespaceId: namespace._id }).save();

      ctx = ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            groupId: group._id,
            toUserId: user._id,
          },
        },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    it('throws an error', async function () {
      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
